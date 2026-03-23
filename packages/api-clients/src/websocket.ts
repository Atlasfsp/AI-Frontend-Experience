export type ConnectionState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected';

export interface ReconnectingWebSocketOptions {
  /** Maximum number of reconnection attempts before giving up. Default: 10 */
  maxRetries?: number;
  /** Base delay in ms for the first retry. Default: 1000 */
  baseDelay?: number;
  /** Maximum delay in ms between retries. Default: 30000 */
  maxDelay?: number;
  /** WebSocket sub-protocols. */
  protocols?: string | string[];

  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onStateChange?: (state: ConnectionState) => void;
}

export interface ReconnectingWebSocket {
  /** Send a message. Queues if not yet connected. */
  send: (data: string | ArrayBuffer | Blob) => void;
  /** Permanently close the connection and stop reconnecting. */
  destroy: () => void;
  /** Get the current connection state. */
  getState: () => ConnectionState;
  /** Get the number of reconnection attempts so far. */
  getRetryCount: () => number;
}

/**
 * Creates a WebSocket connection that automatically reconnects on disconnect
 * with exponential backoff and jitter.
 */
export function createReconnectingWebSocket(
  url: string,
  options: ReconnectingWebSocketOptions = {},
): ReconnectingWebSocket {
  const {
    maxRetries = 10,
    baseDelay = 1000,
    maxDelay = 30000,
    protocols,
    onOpen,
    onClose,
    onError,
    onMessage,
    onStateChange,
  } = options;

  let ws: WebSocket | null = null;
  let state: ConnectionState = 'disconnected';
  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;
  const messageQueue: Array<string | ArrayBuffer | Blob> = [];

  function setState(next: ConnectionState) {
    state = next;
    onStateChange?.(next);
  }

  function calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponential = baseDelay * Math.pow(2, attempt);
    // Cap at maxDelay
    const capped = Math.min(exponential, maxDelay);
    // Add jitter: random value between 0 and the capped delay
    const jitter = Math.random() * capped * 0.5;
    return Math.min(capped + jitter, maxDelay);
  }

  function flushQueue() {
    while (messageQueue.length > 0 && ws?.readyState === WebSocket.OPEN) {
      const message = messageQueue.shift();
      if (message !== undefined) {
        ws.send(message);
      }
    }
  }

  function connect() {
    if (destroyed) {
      return;
    }

    setState('connecting');

    try {
      ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = (event) => {
      retryCount = 0;
      setState('connected');
      flushQueue();
      onOpen?.(event);
    };

    ws.onclose = (event) => {
      setState('disconnected');
      onClose?.(event);

      // Only reconnect if not intentionally destroyed and the close was
      // not a clean close initiated by the client.
      if (!destroyed) {
        scheduleReconnect();
      }
    };

    ws.onerror = (event) => {
      onError?.(event);
    };

    ws.onmessage = (event) => {
      onMessage?.(event);
    };
  }

  function scheduleReconnect() {
    if (destroyed || retryCount >= maxRetries) {
      setState('disconnected');
      return;
    }

    const delay = calculateDelay(retryCount);
    retryCount += 1;

    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, delay);
  }

  function send(data: string | ArrayBuffer | Blob) {
    if (destroyed) {
      return;
    }

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(data);
    } else {
      messageQueue.push(data);
    }
  }

  function destroy() {
    destroyed = true;

    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    if (ws) {
      setState('disconnecting');
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close(1000, 'Client destroyed');
      ws = null;
    }

    messageQueue.length = 0;
    setState('disconnected');
  }

  // Initiate the first connection.
  connect();

  return {
    send,
    destroy,
    getState: () => state,
    getRetryCount: () => retryCount,
  };
}
