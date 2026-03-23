'use client';

import { useEffect, useState } from 'react';

import { loadWebConfig } from '@bac/config';

import { subscribeToHasura } from './subscriptions';

export function useHasuraSubscription<T>(path: string, initialData: T) {
  const config = loadWebConfig();
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (!config.features.liveSubscriptions || config.enableMockApi) {
      return;
    }

    const unsubscribe = subscribeToHasura<T>({
      onMessage(message) {
        setData(message.data);
      },
      url: path,
    });

    return unsubscribe;
  }, [config.enableMockApi, config.features.liveSubscriptions, path]);

  return data;
}
