export type ToolConsequence = 'read' | 'mutation';

export interface BrowserTool {
  name: string;
  accessibleName: string;
  consequence: ToolConsequence;
  execute(arguments_: Readonly<Record<string, unknown>>, signal: AbortSignal): Promise<unknown>;
}

export interface BrowserAction {
  tool: string;
  arguments: Readonly<Record<string, unknown>>;
  currentOrigin: string;
  navigationTarget?: string;
  promptInjectionDetected?: boolean;
  confirmationId?: string;
  idempotencyKey?: string;
}

export interface BrowserAuditRecord {
  tenantId: string;
  actorId: string;
  authorizationDecisionId: string;
  correlationId: string;
  tool: string;
  consequence: ToolConsequence;
  step: number;
  retryCount: number;
  outcome: 'SUCCEEDED';
  confirmationId?: string;
  event: 'browser.action.completed.v1';
}

export interface BrowserActionResult {
  value: unknown;
  audit: BrowserAuditRecord;
}

interface BrowserSessionConfig {
  tenantId: string;
  actorId: string;
  authorizationDecisionId: string;
  correlationId: string;
  allowedTools: string[];
  allowedOrigins: string[];
  enabled: boolean;
  maxSteps: number;
  maxReadRetries: number;
  timeoutMs: number;
  tools: BrowserTool[];
}

function required(value: string | undefined, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} is required`);
  }
  return value.trim();
}

export class GovernedBrowserSession {
  readonly #context: Pick<
    BrowserSessionConfig,
    'tenantId' | 'actorId' | 'authorizationDecisionId' | 'correlationId'
  >;
  readonly #allowedTools: Set<string>;
  readonly #allowedOrigins: Set<string>;
  readonly #tools: Map<string, BrowserTool>;
  readonly #enabled: boolean;
  readonly #maxSteps: number;
  readonly #maxReadRetries: number;
  readonly #timeoutMs: number;
  readonly #controller = new AbortController();
  readonly #mutationResults = new Map<string, Promise<BrowserActionResult>>();
  #steps = 0;
  #cancelReason: string | undefined;

  constructor(config: BrowserSessionConfig & Record<string, unknown>) {
    if ('apiKey' in config || 'modelCredential' in config) {
      throw new TypeError('model credentials must use a server-side model gateway');
    }
    this.#context = {
      tenantId: required(config.tenantId, 'tenant'),
      actorId: required(config.actorId, 'actor'),
      authorizationDecisionId: required(config.authorizationDecisionId, 'authorization decision'),
      correlationId: required(config.correlationId, 'correlation ID'),
    };
    this.#enabled = config.enabled === true;
    if (!Number.isInteger(config.maxSteps) || config.maxSteps < 1) {
      throw new TypeError('maxSteps must be a positive integer');
    }
    if (!Number.isFinite(config.timeoutMs) || config.timeoutMs < 1) {
      throw new TypeError('timeoutMs must be positive');
    }
    this.#maxSteps = config.maxSteps;
    if (!Number.isInteger(config.maxReadRetries) || config.maxReadRetries < 0) {
      throw new TypeError('maxReadRetries must be a non-negative integer');
    }
    this.#maxReadRetries = config.maxReadRetries;
    this.#timeoutMs = config.timeoutMs;
    this.#allowedTools = new Set(config.allowedTools);
    this.#allowedOrigins = new Set(config.allowedOrigins.map((origin) => new URL(origin).origin));
    if (this.#allowedOrigins.size === 0) {
      throw new TypeError('at least one allowed origin is required');
    }
    for (const tool of config.tools) required(tool.accessibleName, `accessible name for ${tool.name}`);
    this.#tools = new Map(config.tools.map((tool) => [tool.name, tool]));
  }

  cancel(reason = 'operator-request'): void {
    this.#cancelReason = required(reason, 'cancellation reason');
    this.#controller.abort(this.#cancelReason);
  }

  async execute(action: BrowserAction): Promise<BrowserActionResult> {
    if (!this.#enabled) {
      throw new Error('governed browser capability is disabled for this tenant');
    }
    if (this.#controller.signal.aborted) {
      throw new Error(`browser session cancelled: ${this.#cancelReason ?? 'cancelled'}`);
    }
    if (action.promptInjectionDetected === true) {
      throw new Error('prompt injection signal requires operator review');
    }
    const currentOrigin = new URL(required(action.currentOrigin, 'current origin')).origin;
    if (!this.#allowedOrigins.has(currentOrigin)) {
      throw new Error(`current origin is not allowlisted: ${currentOrigin}`);
    }
    if (action.navigationTarget) {
      const targetOrigin = new URL(action.navigationTarget, currentOrigin).origin;
      if (targetOrigin !== currentOrigin || !this.#allowedOrigins.has(targetOrigin)) {
        throw new Error(`cross-origin navigation is denied: ${targetOrigin}`);
      }
    }
    if (!this.#allowedTools.has(action.tool)) {
      throw new Error(`tool is not in the server policy allowlist: ${action.tool}`);
    }
    const tool = this.#tools.get(action.tool);
    if (!tool) {
      throw new Error(`allowlisted tool has no registered implementation: ${action.tool}`);
    }
    if (tool.consequence === 'mutation' && !action.confirmationId?.trim()) {
      throw new Error('human confirmation receipt is required for mutations');
    }
    if (tool.consequence === 'mutation') {
      const idempotencyKey = required(action.idempotencyKey, 'mutation idempotency key');
      const key = `${this.#context.tenantId}\u0000${tool.name}\u0000${idempotencyKey}`;
      const prior = this.#mutationResults.get(key);
      if (prior) return prior;
      const execution = this.#executeAction(action, tool);
      this.#mutationResults.set(key, execution);
      try {
        return await execution;
      } catch (error) {
        this.#mutationResults.delete(key);
        throw error;
      }
    }
    return this.#executeAction(action, tool);
  }

  async #executeAction(action: BrowserAction, tool: BrowserTool): Promise<BrowserActionResult> {
    if (this.#steps >= this.#maxSteps) {
      throw new Error('browser session step budget exhausted');
    }
    this.#steps += 1;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        this.#controller.abort('timeout');
        reject(new Error('browser action timeout exceeded'));
      }, this.#timeoutMs);
    });

    try {
      let retryCount = 0;
      let value: unknown;
      for (;;) {
        try {
          value = await Promise.race([
            tool.execute(Object.freeze({ ...action.arguments }), this.#controller.signal),
            timeoutPromise,
          ]);
          break;
        } catch (error) {
          if (
            tool.consequence !== 'read' ||
            retryCount >= this.#maxReadRetries ||
            this.#controller.signal.aborted
          ) {
            throw error;
          }
          retryCount += 1;
        }
      }
      return {
        value,
        audit: Object.freeze({
          ...this.#context,
          tool: tool.name,
          consequence: tool.consequence,
          step: this.#steps,
          retryCount,
          outcome: 'SUCCEEDED' as const,
          ...(action.confirmationId ? { confirmationId: action.confirmationId } : {}),
          event: 'browser.action.completed.v1' as const,
        }),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
