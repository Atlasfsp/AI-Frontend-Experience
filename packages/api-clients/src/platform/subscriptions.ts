import { createLogger } from '@bac/observability';

const logger = createLogger({ app: 'api-clients-platform-subscriptions' });

export interface SubscriptionMessage<T> {
  data: T;
  event: string;
}

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
