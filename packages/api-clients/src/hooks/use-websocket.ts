'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { loadWebConfig } from '@bac/config';
import { useBacSession } from '@bac/auth';

import { WebSocketManager, type ChannelHandler, type ConnectionState } from '../websocket';

// ---------------------------------------------------------------------------
// Singleton manager per URL
// ---------------------------------------------------------------------------

const managers = new Map<string, WebSocketManager>();

function getOrCreateManager(url: string): WebSocketManager {
  let manager = managers.get(url);
  if (!manager) {
    manager = new WebSocketManager({
      onTokenRefresh: async () => {
        // Refresh via the BFF token refresh endpoint.
        // The BFF handles the refresh_token exchange server-side
        // and returns a new access token.
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.status}`);
        }
        const data = (await response.json()) as { access_token: string };
        return data.access_token;
      },
    });
    managers.set(url, manager);
  }
  return manager;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseWebSocketReturn {
  /** Current connection state. */
  state: ConnectionState;
  /** Subscribe to a channel. Returns an unsubscribe function. */
  subscribe: (channel: string, handler: ChannelHandler) => () => void;
  /** Manually disconnect. */
  disconnect: () => void;
}

/**
 * React hook for WebSocket connectivity.
 * Creates or reuses a WebSocketManager instance per URL.
 * Automatically connects using the auth token from session context.
 * Cleans up on unmount.
 *
 * @param url - WebSocket URL. Defaults to the platform WS URL derived from config.
 */
export function useWebSocket(url?: string): UseWebSocketReturn {
  const session = useBacSession();
  const config = loadWebConfig();

  // Derive default WS URL from the platform API URL by switching protocol.
  const resolvedUrl = url ?? deriveWsUrl(config.platformApiUrl);
  const token = session?.accessToken ?? '';

  const managerRef = useRef<WebSocketManager | null>(null);
  const [state, setState] = useState<ConnectionState>('disconnected');

  // Keep track of subscriptions so we can clean up on unmount.
  const activeSubscriptions = useRef<Array<{ channel: string; handler: ChannelHandler }>>([]);

  useEffect(() => {
    if (!resolvedUrl || !token) return;

    const manager = getOrCreateManager(resolvedUrl);
    managerRef.current = manager;

    const unsubState = manager.onStateChange((next) => {
      setState(next);
    });

    // Only connect if currently disconnected or failed.
    const currentState = manager.getState();
    if (currentState === 'disconnected' || currentState === 'failed') {
      manager.connect(resolvedUrl, token);
    }

    setState(manager.getState());

    return () => {
      unsubState();

      // Clean up all subscriptions made via this hook instance.
      for (const sub of activeSubscriptions.current) {
        manager.unsubscribe(sub.channel, sub.handler);
      }
      activeSubscriptions.current = [];

      // If this is the last consumer, disconnect and remove from the map.
      // In practice the singleton lives for the app lifetime; individual
      // component unmounts only clean up their own channel subscriptions.
    };
  }, [resolvedUrl, token]);

  const subscribe = useCallback(
    (channel: string, handler: ChannelHandler): (() => void) => {
      const manager = managerRef.current;
      if (!manager) {
        return () => {};
      }

      manager.subscribe(channel, handler);
      activeSubscriptions.current.push({ channel, handler });

      return () => {
        manager.unsubscribe(channel, handler);
        activeSubscriptions.current = activeSubscriptions.current.filter(
          (s) => !(s.channel === channel && s.handler === handler),
        );
      };
    },
    [],
  );

  const disconnect = useCallback(() => {
    const manager = managerRef.current;
    if (manager) {
      manager.disconnect();
      managers.delete(resolvedUrl);
      managerRef.current = null;
      setState('disconnected');
    }
  }, [resolvedUrl]);

  return { state, subscribe, disconnect };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveWsUrl(httpUrl: string): string {
  try {
    const parsed = new URL(httpUrl);
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    parsed.pathname = parsed.pathname.replace(/\/$/, '') + '/ws';
    return parsed.toString();
  } catch {
    return httpUrl.replace(/^http/, 'ws') + '/ws';
  }
}
