/**
 * Production-ready WebSocket manager with:
 * - Exponential backoff reconnection (1s, 2s, 4s, 8s, 16s, max 30s)
 * - Heartbeat ping/pong (30s interval, 5s timeout)
 * - Channel-based pub/sub
 * - Event buffering during reconnection
 * - Token refresh on auth errors
 * - Max 10 reconnect attempts before 'failed' state
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';

export type StateChangeHandler = (state: ConnectionState) => void;
export type ChannelHandler = (data: unknown) => void;
export type TokenRefresher = () => Promise<string>;

export interface WebSocketManagerOptions {
  /** Max reconnect attempts before entering 'failed' state. Default: 10 */
  maxReconnectAttempts?: number;
  /** Heartbeat interval in ms. Default: 30000 */
  heartbeatIntervalMs?: number;
  /** Pong timeout in ms. Default: 5000 */
  pongTimeoutMs?: number;
  /** Base delay for exponential backoff in ms. Default: 1000 */
  baseDelayMs?: number;
  /** Max reconnection delay in ms. Default: 30000 */
  maxDelayMs?: number;
  /** Max events to buffer during reconnection. Default: 100 */
  maxBufferSize?: number;
  /** Callback to refresh the auth token when a 401/auth error occurs. */
  onTokenRefresh?: TokenRefresher;
}

interface BufferedEvent {
  channel: string;
  data: unknown;
}

interface WireMessage {
  type: 'message' | 'pong' | 'error' | 'subscribe_ack' | 'unsubscribe_ack';
  channel?: string;
  data?: unknown;
  error?: string;
  code?: number;
}

// ---------------------------------------------------------------------------
// WebSocketManager
// ---------------------------------------------------------------------------

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private url = '';
  private token = '';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private readonly subscriptions = new Map<string, Set<ChannelHandler>>();
  private readonly stateListeners = new Set<StateChangeHandler>();
  private readonly eventBuffer: BufferedEvent[] = [];

  private readonly maxReconnectAttempts: number;
  private readonly heartbeatIntervalMs: number;
  private readonly pongTimeoutMs: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly maxBufferSize: number;
  private readonly onTokenRefresh: TokenRefresher | undefined;

  constructor(options: WebSocketManagerOptions = {}) {
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30_000;
    this.pongTimeoutMs = options.pongTimeoutMs ?? 5_000;
    this.baseDelayMs = options.baseDelayMs ?? 1_000;
    this.maxDelayMs = options.maxDelayMs ?? 30_000;
    this.maxBufferSize = options.maxBufferSize ?? 100;
    this.onTokenRefresh = options.onTokenRefresh;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Establish a WebSocket connection.
   */
  connect(url: string, token: string): void {
    this.destroyed = false;
    this.url = url;
    this.token = token;
    this.reconnectAttempts = 0;
    this.openConnection();
  }

  /**
   * Cleanly close the connection and stop all timers.
   */
  disconnect(): void {
    this.destroyed = true;
    this.clearTimers();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.eventBuffer.length = 0;
    this.setState('disconnected');
  }

  /**
   * Subscribe to events on a named channel.
   */
  subscribe(channel: string, handler: ChannelHandler): void {
    let handlers = this.subscriptions.get(channel);
    if (!handlers) {
      handlers = new Set();
      this.subscriptions.set(channel, handlers);
    }
    handlers.add(handler);

    // If connected, tell the server about the subscription.
    if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      this.sendWire({ type: 'subscribe', channel });
    }
  }

  /**
   * Remove a subscription from a channel.
   */
  unsubscribe(channel: string, handler?: ChannelHandler): void {
    const handlers = this.subscriptions.get(channel);
    if (!handlers) return;

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    } else {
      this.subscriptions.delete(channel);
    }

    // If connected and no more handlers for this channel, tell the server.
    if (!this.subscriptions.has(channel) && this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      this.sendWire({ type: 'unsubscribe', channel });
    }
  }

  /**
   * Get current connection state.
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Register a listener for state changes.
   * Returns an unsubscribe function.
   */
  onStateChange(handler: StateChangeHandler): () => void {
    this.stateListeners.add(handler);
    return () => {
      this.stateListeners.delete(handler);
    };
  }

  // -------------------------------------------------------------------------
  // Connection lifecycle
  // -------------------------------------------------------------------------

  private openConnection(): void {
    if (this.destroyed) return;

    this.setState(this.reconnectAttempts === 0 ? 'connecting' : 'reconnecting');

    try {
      const separator = this.url.includes('?') ? '&' : '?';
      const wsUrl = `${this.url}${separator}token=${encodeURIComponent(this.token)}`;
      this.ws = new WebSocket(wsUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState('connected');
      this.startHeartbeat();
      this.resubscribeAll();
      this.flushEventBuffer();
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();

      if (this.destroyed) {
        this.setState('disconnected');
        return;
      }

      // 4001 = auth error convention
      if (event.code === 4001 || event.code === 401) {
        this.handleAuthError();
        return;
      }

      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // The onclose handler will fire after onerror, so reconnection is handled there.
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  // -------------------------------------------------------------------------
  // Message handling
  // -------------------------------------------------------------------------

  private handleMessage(event: MessageEvent): void {
    let msg: WireMessage;
    try {
      msg = JSON.parse(event.data as string) as WireMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'pong':
        this.handlePong();
        break;

      case 'message':
        if (msg.channel) {
          this.dispatchToChannel(msg.channel, msg.data);
        }
        break;

      case 'error':
        if (msg.code === 401) {
          this.handleAuthError();
        }
        break;

      // subscribe_ack and unsubscribe_ack are informational
      default:
        break;
    }
  }

  private dispatchToChannel(channel: string, data: unknown): void {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch {
          // Swallow handler errors to prevent one bad handler from breaking others.
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Heartbeat
  // -------------------------------------------------------------------------

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;

      this.sendWire({ type: 'ping' });

      this.pongTimer = setTimeout(() => {
        // No pong received within timeout; force reconnect.
        this.ws?.close(4000, 'Pong timeout');
      }, this.pongTimeoutMs);
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pongTimer !== null) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private handlePong(): void {
    if (this.pongTimer !== null) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  // -------------------------------------------------------------------------
  // Reconnection
  // -------------------------------------------------------------------------

  private scheduleReconnect(): void {
    if (this.destroyed) {
      this.setState('disconnected');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('failed');
      return;
    }

    const delay = this.calculateBackoff(this.reconnectAttempts);
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openConnection();
    }, delay);
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s capped at 30s
    const exponential = this.baseDelayMs * Math.pow(2, attempt);
    return Math.min(exponential, this.maxDelayMs);
  }

  // -------------------------------------------------------------------------
  // Auth error handling
  // -------------------------------------------------------------------------

  private async handleAuthError(): Promise<void> {
    if (!this.onTokenRefresh) {
      this.setState('failed');
      return;
    }

    try {
      this.token = await this.onTokenRefresh();
      this.reconnectAttempts = 0;
      this.openConnection();
    } catch {
      this.setState('failed');
    }
  }

  // -------------------------------------------------------------------------
  // Event buffering
  // -------------------------------------------------------------------------

  private bufferEvent(channel: string, data: unknown): void {
    if (this.eventBuffer.length >= this.maxBufferSize) {
      // Drop oldest event
      this.eventBuffer.shift();
    }
    this.eventBuffer.push({ channel, data });
  }

  private flushEventBuffer(): void {
    while (this.eventBuffer.length > 0) {
      const event = this.eventBuffer.shift();
      if (event) {
        this.dispatchToChannel(event.channel, event.data);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Channel management
  // -------------------------------------------------------------------------

  private resubscribeAll(): void {
    for (const channel of this.subscriptions.keys()) {
      this.sendWire({ type: 'subscribe', channel });
    }
  }

  // -------------------------------------------------------------------------
  // Wire protocol helpers
  // -------------------------------------------------------------------------

  private sendWire(payload: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // -------------------------------------------------------------------------
  // State management
  // -------------------------------------------------------------------------

  private setState(next: ConnectionState): void {
    if (this.state === next) return;
    this.state = next;
    for (const listener of this.stateListeners) {
      try {
        listener(next);
      } catch {
        // Swallow listener errors.
      }
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
