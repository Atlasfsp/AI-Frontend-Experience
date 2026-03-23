import { createLogger } from './logger';

const logger = createLogger({ app: 'observability-metrics' });

export interface MetricEvent {
  attributes?: Record<string, boolean | number | string>;
  name: string;
  value: number;
}

export function recordMetric(event: MetricEvent) {
  logger.info('metric.recorded', {
    metric: event.name,
    attributes: event.attributes,
    value: event.value,
  });
}
