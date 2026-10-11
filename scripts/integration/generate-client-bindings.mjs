import path from 'node:path';

import { readJson, snapshotGeneratedAt, writeText } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const consumedUpstreams = readJson(root, 'compatibility/consumed-upstreams.json');

const softwareFactoryManifest = readJson(root, 'contracts/upstreams/ai-software-factory/api/openapi/manifest.json');
const softwareFactoryOpenApi = readJson(root, 'contracts/upstreams/ai-software-factory/api/openapi/openapi.json');
const platformManifest = readJson(root, 'contracts/upstreams/ai-platform-automation/api/openapi/manifest.json');
const platformOpenApi = readJson(root, 'contracts/upstreams/ai-platform-automation/api/openapi/platform-automation-v1.openapi.json');
const generatedAt = snapshotGeneratedAt(consumedUpstreams);

const softwareFactoryContract = softwareFactoryManifest.artifacts.find(
  (artifact) => artifact.artifactId === 'software-factory-openapi',
);
const platformContract = platformManifest.artifacts.find(
  (artifact) => artifact.artifactId === 'platform-automation-openapi',
);
const softwareFactoryRelease = consumedUpstreams.selectedUpstreams.find(
  (upstream) => upstream.slug === 'ai-software-factory',
);
const platformRelease = consumedUpstreams.selectedUpstreams.find(
  (upstream) => upstream.slug === 'ai-platform-automation',
);

const softwareFactoryPaths = Object.keys(softwareFactoryOpenApi.paths ?? {}).sort();
const platformPaths = Object.keys(platformOpenApi.paths ?? {}).sort();

// ---------------------------------------------------------------------------
// Helpers for OpenAPI → TypeScript codegen
// ---------------------------------------------------------------------------

/** Map OpenAPI type + format to a TypeScript type string. */
function tsType(schema, specs) {
  if (!schema) return 'unknown';

  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, specs);
    if (resolved.__refName) return resolved.__refName;
    return tsType(resolved, specs);
  }

  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(' | ');
  }

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array': {
      const itemType = schema.items ? tsType(schema.items, specs) : 'unknown';
      return `${itemType}[]`;
    }
    case 'object': {
      if (schema.additionalProperties && !schema.properties) {
        const valType =
          schema.additionalProperties === true
            ? 'unknown'
            : tsType(schema.additionalProperties, specs);
        return `Record<string, ${valType}>`;
      }
      if (schema.properties) {
        return inlineObjectType(schema, specs);
      }
      return 'Record<string, unknown>';
    }
    default:
      return 'unknown';
  }
}

/** Produce an inline `{ key: Type; ... }` block for an object schema. */
function inlineObjectType(schema, specs) {
  if (!schema.properties) return 'Record<string, unknown>';
  const required = new Set(schema.required ?? []);
  const lines = Object.entries(schema.properties).map(([key, prop]) => {
    const opt = required.has(key) ? '' : '?';
    return `  ${safePropName(key)}${opt}: ${tsType(prop, specs)};`;
  });
  return `{\n${lines.join('\n')}\n}`;
}

/** Resolve a $ref like "#/components/schemas/Foo" and tag the result with __refName. */
function resolveRef(ref, specs) {
  const parts = ref.replace(/^#\//, '').split('/');
  let node = specs;
  for (const p of parts) node = node?.[p];
  if (node && parts.length >= 3 && parts[parts.length - 2] === 'schemas') {
    return { ...node, __refName: parts[parts.length - 1] };
  }
  return node ?? {};
}

/** PascalCase from kebab/snake string. */
function pascalCase(str) {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/[{}]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
}

/** camelCase from kebab/snake string. */
function camelCase(str) {
  const p = pascalCase(str);
  return p[0].toLowerCase() + p.slice(1);
}

/** Make a safe property name (wrap in quotes if needed). */
function safePropName(name) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : `'${name}'`;
}

// ---------------------------------------------------------------------------
// Generate interface types from components/schemas
// ---------------------------------------------------------------------------

function generateSchemaInterfaces(schemas, specs) {
  const lines = [];
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.type === 'string' && schema.enum) {
      lines.push(`export type ${name} = ${schema.enum.map((v) => JSON.stringify(v)).join(' | ')};`);
      lines.push('');
      continue;
    }

    lines.push(`export interface ${name} {`);
    const required = new Set(schema.required ?? []);
    for (const [prop, propSchema] of Object.entries(schema.properties ?? {})) {
      const opt = required.has(prop) ? '' : '?';
      lines.push(`  ${safePropName(prop)}${opt}: ${tsType(propSchema, specs)};`);
    }
    lines.push('}');
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Extract response type for an operation
// ---------------------------------------------------------------------------

function getSuccessResponseType(operation, specs) {
  const responses = operation.responses ?? {};
  const successCode = Object.keys(responses).find((code) => code.startsWith('2'));
  if (!successCode) return 'void';
  const resp = responses[successCode];
  const jsonContent = resp?.content?.['application/json'];
  if (!jsonContent?.schema) return 'void';
  const schema = jsonContent.schema;
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    return refName;
  }
  // Inline schema -- generate an inline type
  return tsType(schema, specs);
}

// ---------------------------------------------------------------------------
// Extract request body type for an operation
// ---------------------------------------------------------------------------

function getRequestBodyType(operation, specs) {
  const body = operation.requestBody;
  if (!body) return null;
  const jsonContent = body.content?.['application/json'];
  if (!jsonContent?.schema) return null;
  const schema = jsonContent.schema;
  if (schema.$ref) {
    return schema.$ref.split('/').pop();
  }
  return tsType(schema, specs);
}

// ---------------------------------------------------------------------------
// Extract path and query parameters
// ---------------------------------------------------------------------------

function getParameters(operation, specs) {
  const params = operation.parameters ?? [];
  const pathParams = [];
  const queryParams = [];

  for (const p of params) {
    const param = p.$ref ? resolveRef(p.$ref, specs) : p;
    if (param.in === 'path') {
      pathParams.push({ name: camelCase(param.name), rawName: param.name, type: tsType(param.schema, specs), required: true });
    } else if (param.in === 'query') {
      queryParams.push({
        name: camelCase(param.name),
        rawName: param.name,
        type: tsType(param.schema, specs),
        required: param.required ?? false,
      });
    }
    // Skip header params (handled by transport)
  }

  return { pathParams, queryParams };
}

// ---------------------------------------------------------------------------
// Build a method name from operationId or path+method
// ---------------------------------------------------------------------------

function methodName(operationId, httpMethod, pathStr) {
  if (operationId) return camelCase(operationId);
  const segments = pathStr
    .split('/')
    .filter((s) => s && !s.startsWith('{'));
  return camelCase(`${httpMethod}_${segments.join('_')}`);
}

// ---------------------------------------------------------------------------
// Generate a typed client class
// ---------------------------------------------------------------------------

function generateClientClass(className, openApi, specs) {
  const methods = [];
  const paths = openApi.paths ?? {};

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    for (const httpMethod of ['get', 'post', 'put', 'patch', 'delete']) {
      const operation = pathItem[httpMethod];
      if (!operation) continue;

      const name = methodName(operation.operationId, httpMethod, pathStr);
      const { pathParams, queryParams } = getParameters(operation, specs);
      const bodyType = getRequestBodyType(operation, specs);
      const returnType = getSuccessResponseType(operation, specs);

      // Build param list
      const paramEntries = [];
      for (const pp of pathParams) {
        paramEntries.push(`${pp.name}: ${pp.type}`);
      }
      if (bodyType) {
        paramEntries.push(`body: ${bodyType}`);
      }
      if (queryParams.length > 0) {
        const qLines = queryParams.map((qp) => {
          const opt = qp.required ? '' : '?';
          return `    ${qp.name}${opt}: ${qp.type};`;
        });
        paramEntries.push(`query?: {\n${qLines.join('\n')}\n  }`);
      }

      const paramsStr = paramEntries.length > 0 ? paramEntries.join(', ') : '';

      // Build URL expression
      let urlExpr;
      if (pathParams.length > 0) {
        const template = pathStr.replace(/\{([^}]+)\}/g, (_, paramName) => {
          return `\${encodeURIComponent(${camelCase(paramName)})}`;
        });
        urlExpr = `\`\${this.baseUrl}${template}\``;
      } else {
        urlExpr = `\`\${this.baseUrl}${pathStr}\``;
      }

      // Build query string logic
      let queryLogic = '';
      if (queryParams.length > 0) {
        queryLogic = `
    const params = new URLSearchParams();
    if (query) {
${queryParams.map((qp) => `      if (query.${qp.name} !== undefined) params.set('${qp.rawName}', String(query.${qp.name}));`).join('\n')}
    }
    const qs = params.toString();
    const urlWithQuery = qs ? \`\${url}?\${qs}\` : url;`;
      }

      const fetchUrl = queryParams.length > 0 ? 'urlWithQuery' : 'url';

      // Build init object
      const initParts = [`method: '${httpMethod.toUpperCase()}'`];
      if (bodyType) {
        initParts.push(`body: JSON.stringify(body)`);
        initParts.push(`headers: { 'content-type': 'application/json' }`);
      }
      const initStr = `{ ${initParts.join(', ')} }`;

      const returnTypeStr = returnType === 'void' ? 'void' : returnType;

      methods.push(`
  /** ${operation.summary ?? `${httpMethod.toUpperCase()} ${pathStr}`} */
  async ${name}(${paramsStr}): Promise<${returnTypeStr}> {
    const token = await this.getToken();
    const url = ${urlExpr};${queryLogic}
    return requestJson<${returnTypeStr}>(${fetchUrl}, ${initStr}, { accessToken: token });
  }`);
    }
  }

  return `export class ${className} {
  private readonly baseUrl: string;
  private readonly getToken: () => Promise<string>;

  constructor(config: { baseUrl: string; getToken: () => Promise<string> }) {
    this.baseUrl = config.baseUrl.replace(/\\/$/, '');
    this.getToken = config.getToken;
  }
${methods.join('\n')}
}
`;
}

// ---------------------------------------------------------------------------
// 1. Generate contract-registry.ts (same as before)
// ---------------------------------------------------------------------------

const registryTs = `// Auto-generated by generate-client-bindings.mjs — do not edit.
import { SoftwareFactoryApiClient } from './software-factory-client';
import { PlatformAutomationApiClient } from './platform-automation-client';

export { SoftwareFactoryApiClient } from './software-factory-client';
export { PlatformAutomationApiClient } from './platform-automation-client';

export interface GeneratedContractBinding {
  readonly producerRepo: string;
  readonly artifactId: string;
  readonly version: string;
  readonly releaseTag: string | null;
  readonly endpointCount: number;
  readonly endpoints: readonly string[];
  readonly generatedAt: string;
}

export const softwareFactoryPaths = ${JSON.stringify(softwareFactoryPaths, null, 2)} as const;

export const platformAutomationPaths = ${JSON.stringify(platformPaths, null, 2)} as const;

export const generatedContractBindings: readonly GeneratedContractBinding[] = [
  {
    producerRepo: 'ai-software-factory',
    artifactId: '${softwareFactoryContract.artifactId}',
    version: '${softwareFactoryContract.version}',
    releaseTag: ${JSON.stringify(softwareFactoryRelease?.releaseTag ?? null)},
    endpointCount: softwareFactoryPaths.length,
    endpoints: softwareFactoryPaths,
    generatedAt: '${generatedAt}',
  },
  {
    producerRepo: 'ai-platform-automation',
    artifactId: '${platformContract.artifactId}',
    version: '${platformContract.version}',
    releaseTag: ${JSON.stringify(platformRelease?.releaseTag ?? null)},
    endpointCount: platformAutomationPaths.length,
    endpoints: platformAutomationPaths,
    generatedAt: '${generatedAt}',
  },
] as const;

// ---------------------------------------------------------------------------
// Factory function for creating typed API clients
// ---------------------------------------------------------------------------

export interface ApiClientsConfig {
  sdxBaseUrl: string;
  platformBaseUrl: string;
  getToken: () => Promise<string>;
}

export function createApiClients(config: ApiClientsConfig) {
  return {
    sdx: new SoftwareFactoryApiClient({
      baseUrl: config.sdxBaseUrl,
      getToken: config.getToken,
    }),
    platform: new PlatformAutomationApiClient({
      baseUrl: config.platformBaseUrl,
      getToken: config.getToken,
    }),
  };
}
`;

writeText(root, 'packages/api-clients/src/generated/contract-registry.ts', registryTs);

// ---------------------------------------------------------------------------
// 2. Generate software-factory-client.ts
// ---------------------------------------------------------------------------

const sdxSchemas = softwareFactoryOpenApi.components?.schemas ?? {};
const sdxInterfaces = generateSchemaInterfaces(sdxSchemas, softwareFactoryOpenApi);
const sdxClientClass = generateClientClass('SoftwareFactoryApiClient', softwareFactoryOpenApi, softwareFactoryOpenApi);

const sdxClientTs = `// Auto-generated by generate-client-bindings.mjs — do not edit.
import { requestJson } from '../http';
import type { RequestContext } from '../http';

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

${sdxInterfaces}
// ---------------------------------------------------------------------------
// Typed API client
// ---------------------------------------------------------------------------

${sdxClientClass}`;

writeText(root, 'packages/api-clients/src/generated/software-factory-client.ts', sdxClientTs);

// ---------------------------------------------------------------------------
// 3. Generate platform-automation-client.ts
// ---------------------------------------------------------------------------

const platformSchemas = platformOpenApi.components?.schemas ?? {};
const platformInterfaces = generateSchemaInterfaces(platformSchemas, platformOpenApi);
const platformClientClass = generateClientClass('PlatformAutomationApiClient', platformOpenApi, platformOpenApi);

const platformClientTs = `// Auto-generated by generate-client-bindings.mjs — do not edit.
import { requestJson } from '../http';
import type { RequestContext } from '../http';

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

${platformInterfaces}
// ---------------------------------------------------------------------------
// Typed API client
// ---------------------------------------------------------------------------

${platformClientClass}`;

writeText(root, 'packages/api-clients/src/generated/platform-automation-client.ts', platformClientTs);

// ---------------------------------------------------------------------------
// 4. Write manifest (same as before)
// ---------------------------------------------------------------------------

const manifest = {
  schemaVersion: '1.0.0',
  generatedAt,
  sourceMode: consumedUpstreams.sourceMode,
  packageName: '@bac/api-clients',
  packageVersion: '1.0.0',
  upstreamArtifacts: [
    {
      producerRepo: 'ai-software-factory',
      artifactId: softwareFactoryContract.artifactId,
      version: softwareFactoryContract.version,
      releaseTag: softwareFactoryRelease?.releaseTag ?? null,
      endpointCount: softwareFactoryPaths.length,
    },
    {
      producerRepo: 'ai-platform-automation',
      artifactId: platformContract.artifactId,
      version: platformContract.version,
      releaseTag: platformRelease?.releaseTag ?? null,
      endpointCount: platformPaths.length,
    },
  ],
};

writeText(
  root,
  'packages/api-clients/contracts/generated-client.manifest.json',
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log('Generated web client bindings updated.');
console.log(`  - contract-registry.ts`);
console.log(`  - software-factory-client.ts  (${Object.keys(sdxSchemas).length} types, ${Object.keys(softwareFactoryOpenApi.paths ?? {}).length} paths)`);
console.log(`  - platform-automation-client.ts  (${Object.keys(platformSchemas).length} types, ${Object.keys(platformOpenApi.paths ?? {}).length} paths)`);
