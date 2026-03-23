import { SpanStatusCode, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('bac-frontend');

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T> | T,
): Promise<T> {
  const span = tracer.startSpan(name);

  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });

  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
