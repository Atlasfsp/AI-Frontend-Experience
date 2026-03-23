import { createLogger } from '@bac/observability';

const logger = createLogger({ app: 'api-clients-platform-subscriptions' });

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SubscriptionMessage<T> {
  data: T;
  event: string;
}

export interface SubscriptionOptions {
  query: string;
  variables?: Record<string, unknown>;
  onData: (data: unknown) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Legacy SSE helper (kept for backward compat)                       */
/* ------------------------------------------------------------------ */

export function subscribeToHasura<T>({
  onError,
  onMessage,
  url,
}: {
  onError?: (error: Error) => void;
  onMessage: (message: SubscriptionMessage<T>) => void;
  url: string;
}) {
  const source = new EventSource(url, { withCredentials: true });

  source.onmessage = (event) => {
    try {
      onMessage({
        data: JSON.parse(event.data) as T,
        event: event.type,
      });
    } catch (error) {
      onError?.(error as Error);
    }
  };

  source.onerror = () => {
    const error = new Error(`Subscription stream failed for ${url}`);
    logger.error('platform.subscription_error', { url });
    onError?.(error);
  };

  return () => source.close();
}

/* ------------------------------------------------------------------ */
/*  HasuraSubscriptionClient                                           */
/* ------------------------------------------------------------------ */

/**
 * GraphQL SSE subscription client for Hasura real-time events.
 * Uses Server-Sent Events (not WebSocket) for Hasura streaming subscriptions.
 *
 * Hasura exposes a streaming subscription endpoint that accepts a GraphQL
 * query via query-string parameters and returns an SSE stream. This client
 * wraps EventSource with token injection and reconnection management.
 */
export class HasuraSubscriptionClient {
  private baseUrl: string;
  private getToken: () => Promise<string>;
  private connections: Map<string, { source: EventSource; abort: AbortController }>;
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
  private maxReconnectDelay = 30_000;

  constructor(config: { baseUrl: string; getToken: () => Promise<string> }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken;
    this.connections = new Map();
    this.reconnectTimers = new Map();
  }

  /**
   * Opens an SSE subscription to the Hasura streaming endpoint.
   * Returns an unsubscribe function that closes the connection.
   */
  subscribe(id: string, options: SubscriptionOptions): () => void {
    // Close any existing connection with the same id
    this.unsubscribe(id);

    const abort = new AbortController();
    let retryCount = 0;

    const connect = async () => {
      if (abort.signal.aborted) return;

      try {
        const token = await this.getToken();
        const params = new URLSearchParams({
          query: options.query,
        });

        if (options.variables) {
          params.set('variables', JSON.stringify(options.variables));
        }

        const url = `${this.baseUrl}/v1/graphql?${params.toString()}`;

        const source = new EventSource(url, { withCredentials: true });

        // Store reference before attaching handlers
        this.connections.set(id, { source, abort });

        source.onmessage = (event) => {
          retryCount = 0; // reset on successful message

          try {
            const parsed = JSON.parse(event.data) as { data?: unknown; errors?: Array<{ message: string }> };

            if (parsed.errors?.length) {
              const errorMessage = parsed.errors.map((e) => e.message).join('; ');
              options.onError?.(new Error(`Subscription error: ${errorMessage}`));
              return;
            }

            if (parsed.data !== undefined) {
              options.onData(parsed.data);
            }
          } catch (error) {
            options.onError?.(error as Error);
          }
        };

        source.addEventListener('complete', () => {
          options.onComplete?.();
          this.cleanupConnection(id);
        });

        source.onerror = () => {
          if (abort.signal.aborted) return;

          logger.error('platform.subscription_sse_error', { id, url: this.baseUrl });

          source.close();
          this.connections.delete(id);

          // Exponential backoff reconnection
          const delay = Math.min(1000 * Math.pow(2, retryCount), this.maxReconnectDelay);
          retryCount += 1;

          const timer = setTimeout(() => {
            this.reconnectTimers.delete(id);
            void connect();
          }, delay);

          this.reconnectTimers.set(id, timer);

          options.onError?.(new Error(`Subscription ${id} disconnected, reconnecting in ${delay}ms`));
        };
      } catch (error) {
        options.onError?.(error as Error);
      }
    };

    void connect();

    return () => this.unsubscribe(id);
  }

  /**
   * Close a specific subscription by id.
   */
  unsubscribe(id: string): void {
    this.cleanupConnection(id);

    const timer = this.reconnectTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(id);
    }
  }

  /**
   * Close all active subscriptions.
   */
  disconnectAll(): void {
    for (const id of this.connections.keys()) {
      this.unsubscribe(id);
    }

    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
  }

  /**
   * Returns the number of active subscriptions.
   */
  get activeCount(): number {
    return this.connections.size;
  }

  private cleanupConnection(id: string): void {
    const entry = this.connections.get(id);
    if (entry) {
      entry.abort.abort();
      entry.source.close();
      this.connections.delete(id);
    }
  }
}
