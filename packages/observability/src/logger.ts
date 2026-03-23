export interface LogContext {
  app?: string;
  tenantId?: string;
  traceId?: string;
  workspaceId?: string;
  [key: string]: unknown;
}

function emit(level: 'debug' | 'info' | 'warn' | 'error', message: string, context: LogContext) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  console[level === 'debug' ? 'log' : level](JSON.stringify(payload));
}

export function createLogger(baseContext: LogContext = {}) {
  return {
    debug(message: string, context: LogContext = {}) {
      emit('debug', message, { ...baseContext, ...context });
    },
    info(message: string, context: LogContext = {}) {
      emit('info', message, { ...baseContext, ...context });
    },
    warn(message: string, context: LogContext = {}) {
      emit('warn', message, { ...baseContext, ...context });
    },
    error(message: string, context: LogContext = {}) {
      emit('error', message, { ...baseContext, ...context });
    },
  };
}
