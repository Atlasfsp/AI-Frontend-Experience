'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { loadWebConfig } from '@bac/config';

import { HasuraSubscriptionClient } from '../platform/subscriptions';

/* ------------------------------------------------------------------ */
/*  Singleton client                                                   */
/* ------------------------------------------------------------------ */

let _sharedClient: HasuraSubscriptionClient | null = null;

function getSharedClient(): HasuraSubscriptionClient {
  if (!_sharedClient) {
    const config = loadWebConfig();

    _sharedClient = new HasuraSubscriptionClient({
      baseUrl: config.platformApiUrl,
      getToken: async () => {
        // In BFF-proxy mode the browser cookie is used automatically.
        // For direct connections, the token comes from the auth context.
        // This returns an empty string for cookie-based auth.
        return '';
      },
    });
  }

  return _sharedClient;
}

/**
 * Override the shared subscription client (useful for testing or
 * when the auth layer can supply a real access-token getter).
 */
export function setSubscriptionClient(client: HasuraSubscriptionClient): void {
  _sharedClient?.disconnectAll();
  _sharedClient = client;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export interface UseSubscriptionResult<T> {
  data: T | null;
  error: Error | null;
  isConnected: boolean;
}

/**
 * React hook for Hasura GraphQL subscriptions.
 * Manages subscription lifecycle tied to component mount/unmount.
 *
 * The hook auto-subscribes when the component mounts and unsubscribes
 * on unmount. If `query` or `variables` change the subscription is
 * automatically re-established.
 */
export function useSubscription<T>(
  query: string,
  variables?: Record<string, unknown>,
): UseSubscriptionResult<T> {
  const config = loadWebConfig();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const idRef = useRef(`sub-${Math.random().toString(36).slice(2, 10)}`);

  // Serialized variables for dep comparison
  const variablesKey = variables ? JSON.stringify(variables) : '';

  const handleData = useCallback((incoming: unknown) => {
    setData(incoming as T);
    setIsConnected(true);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err);
    setIsConnected(false);
  }, []);

  const handleComplete = useCallback(() => {
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Skip when subscriptions are disabled or mock mode is active
    if (!config.features.liveSubscriptions || config.enableMockApi) {
      return;
    }

    const client = getSharedClient();
    const id = idRef.current;
    const subscriptionOptions: Parameters<typeof client.subscribe>[1] = {
      query,
      onData: handleData,
      onError: handleError,
      onComplete: handleComplete,
    };

    if (variables) {
      subscriptionOptions.variables = variables;
    }

    const unsubscribe = client.subscribe(id, subscriptionOptions);

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- variablesKey is a stable serialization
  }, [config.enableMockApi, config.features.liveSubscriptions, query, variablesKey, handleData, handleError, handleComplete]);

  return { data, error, isConnected };
}
