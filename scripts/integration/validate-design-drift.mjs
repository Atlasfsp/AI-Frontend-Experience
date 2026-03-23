import fs from 'node:fs';
import path from 'node:path';

import { ensure, readJson, routePathFromPageFile } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const webRouteMap = readJson(root, 'contracts/upstreams/design-factory-figma/handoff/route-maps/frontend-web.json');
const webComponentSpecs = readJson(root, 'contracts/upstreams/design-factory-figma/handoff/component-specs/web-enterprise-shell.json');
const webStateMap = readJson(root, 'contracts/upstreams/design-factory-figma/handoff/state-maps/frontend-web.json');

function collectRoutes(appName, appRoot) {
  const pages = [];
  walk(appRoot, (filePath) => {
    if (filePath.endsWith('page.tsx')) {
      pages.push(routePathFromPageFile(appRoot, filePath));
    }
  });
  return {
    app: appName,
    routes: new Set(pages),
  };
}

function walk(currentPath, visit) {
  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, visit);
    } else {
      visit(fullPath);
    }
  }
}

const implementedRoutes = new Map();
for (const { app, routes } of [
  collectRoutes('software-factory-web', path.join(root, 'apps/software-factory-web/app')),
  collectRoutes('platform-automation-web', path.join(root, 'apps/platform-automation-web/app')),
  collectRoutes('docs-portal', path.join(root, 'apps/docs-portal/app')),
]) {
  implementedRoutes.set(app, routes);
}

for (const target of webRouteMap.targets) {
  const actualRoutes = implementedRoutes.get(target.app);
  ensure(actualRoutes, `Missing implemented route inventory for ${target.app}`);
  for (const route of target.routes) {
    ensure(actualRoutes.has(route.path), `Missing design-handled route ${route.path} in ${target.app}`);
  }
}

for (const component of webComponentSpecs.components) {
  ensure(
    fs.existsSync(path.join(root, component.fileHint)),
    `Missing implementation file for design component ${component.componentId}: ${component.fileHint}`,
  );
}

for (const target of webStateMap.targets) {
  const actualRoutes = implementedRoutes.get(target.app);
  ensure(actualRoutes, `Missing implemented state-map route inventory for ${target.app}`);
  for (const screenState of target.screenStates) {
    ensure(actualRoutes.has(screenState.routePath), `Missing state-map route ${screenState.routePath} in ${target.app}`);
    for (const state of screenState.states) {
      const fullPath = path.join(root, state.fileHint);
      ensure(fs.existsSync(fullPath), `Missing state-map implementation file ${state.fileHint}`);
      const contents = fs.readFileSync(fullPath, 'utf8');
      for (const marker of state.markers) {
        ensure(
          contents.includes(marker),
          `State-map drift: ${screenState.screenId} (${state.name}) missing marker "${marker}" in ${state.fileHint}`,
        );
      }
    }
  }
}

const enterpriseSnapshot = fs.readFileSync(
  path.join(root, 'contracts/upstreams/design-factory-figma/design-system/tokens/enterprise.json'),
  'utf8',
);
const enterpriseLocal = fs.readFileSync(
  path.join(root, 'packages/design-tokens/src/tokens/enterprise.json'),
  'utf8',
);
ensure(enterpriseSnapshot === enterpriseLocal, 'Enterprise design tokens drift from Figma handoff snapshot');

const consumerSnapshot = fs.readFileSync(
  path.join(root, 'contracts/upstreams/design-factory-figma/design-system/tokens/consumer.json'),
  'utf8',
);
const consumerLocal = fs.readFileSync(
  path.join(root, 'packages/design-tokens/src/tokens/consumer.json'),
  'utf8',
);
ensure(consumerSnapshot === consumerLocal, 'Consumer design tokens drift from Figma handoff snapshot');

console.log('Frontend design handoff validation passed.');
