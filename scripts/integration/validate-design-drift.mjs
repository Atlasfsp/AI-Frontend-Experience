import fs from 'node:fs';
import path from 'node:path';

import { readJson, routePathFromPageFile, writeJson } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const figmaRouteMap = readJson(root, 'contracts/upstreams/design-factory-figma/handoff/route-maps/frontend-web.json');
const stitchScreenMap = readJson(root, 'contracts/upstreams/design-factory-stitch/handoffs/screen-maps/ai-frontend-experience.json');
const webComponentSpecs = readJson(root, 'contracts/upstreams/design-factory-figma/handoff/component-specs/web-enterprise-shell.json');
const webStateMap = readJson(root, 'contracts/upstreams/design-factory-figma/handoff/state-maps/frontend-web.json');
const threshold = 0.95;

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

function hasTokenShape(bundle) {
  return Boolean(
    bundle &&
      typeof bundle === 'object' &&
      typeof bundle.brandMode === 'string' &&
      bundle.color?.primary &&
      bundle.typography?.display &&
      bundle.typography?.scale?.['2xl'] &&
      typeof bundle.spacing?.md === 'number' &&
      typeof bundle.radius?.md === 'number' &&
      bundle.elevation?.medium &&
      typeof bundle.components?.appShell?.navWidth === 'number' &&
      typeof bundle.components?.table?.rowHeight === 'number',
  );
}

const implementedRoutes = new Map();
for (const { app, routes } of [
  collectRoutes('software-factory-web', path.join(root, 'apps/software-factory-web/app')),
  collectRoutes('platform-automation-web', path.join(root, 'apps/platform-automation-web/app')),
  collectRoutes('docs-portal', path.join(root, 'apps/docs-portal/app')),
]) {
  implementedRoutes.set(app, routes);
}

const issues = [];

let matchedFigmaRoutes = 0;
let totalFigmaRoutes = 0;
for (const target of figmaRouteMap.targets) {
  const actualRoutes = implementedRoutes.get(target.app);
  if (!actualRoutes) {
    issues.push(`Missing implemented route inventory for ${target.app}`);
    continue;
  }
  for (const route of target.routes) {
    totalFigmaRoutes += 1;
    if (actualRoutes.has(route.path)) {
      matchedFigmaRoutes += 1;
    } else {
      issues.push(`Missing Figma route ${route.path} in ${target.app}`);
    }
  }
}

let matchedStitchRoutes = 0;
const totalStitchRoutes = stitchScreenMap.screenMaps.length;
for (const screenMap of stitchScreenMap.screenMaps) {
  const routeExists = [...implementedRoutes.values()].some((routes) => routes.has(screenMap.routePath));
  if (routeExists) {
    matchedStitchRoutes += 1;
  } else {
    issues.push(`Missing Stitch screen-map route ${screenMap.routePath}`);
  }
}

let matchedComponents = 0;
const totalComponents = webComponentSpecs.components.length;
for (const component of webComponentSpecs.components) {
  if (fs.existsSync(path.join(root, component.fileHint))) {
    matchedComponents += 1;
  } else {
    issues.push(`Missing component implementation for ${component.componentId}: ${component.fileHint}`);
  }
}

let matchedStates = 0;
let totalStates = 0;
for (const target of webStateMap.targets) {
  const actualRoutes = implementedRoutes.get(target.app);
  if (!actualRoutes) {
    issues.push(`Missing implemented state-map route inventory for ${target.app}`);
    continue;
  }
  for (const screenState of target.screenStates) {
    if (!actualRoutes.has(screenState.routePath)) {
      issues.push(`Missing state-map route ${screenState.routePath} in ${target.app}`);
    }
    for (const state of screenState.states) {
      totalStates += 1;
      const fullPath = path.join(root, state.fileHint);
      if (!fs.existsSync(fullPath)) {
        issues.push(`Missing state-map implementation file ${state.fileHint}`);
        continue;
      }
      const contents = fs.readFileSync(fullPath, 'utf8');
      const allMarkersPresent = state.markers.every((marker) => contents.includes(marker));
      if (allMarkersPresent) {
        matchedStates += 1;
      } else {
        const missingMarkers = state.markers.filter((marker) => !contents.includes(marker)).join(', ');
        issues.push(`State-map drift for ${screenState.screenId} (${state.name}) missing markers ${missingMarkers} in ${state.fileHint}`);
      }
    }
  }
}

const enterpriseSnapshot = readJson(root, 'contracts/upstreams/design-factory-figma/design-system/tokens/enterprise.json');
const enterpriseLocal = readJson(root, 'packages/design-tokens/src/tokens/enterprise.json');
const consumerSnapshot = readJson(root, 'contracts/upstreams/design-factory-figma/design-system/tokens/consumer.json');
const consumerLocal = readJson(root, 'packages/design-tokens/src/tokens/consumer.json');

if (!hasTokenShape(enterpriseSnapshot)) {
  issues.push('Enterprise token bundle does not match the canonical token schema');
}
if (!hasTokenShape(consumerSnapshot)) {
  issues.push('Consumer token bundle does not match the canonical token schema');
}
if (JSON.stringify(enterpriseSnapshot) !== JSON.stringify(enterpriseLocal)) {
  issues.push('Enterprise design tokens drift from the Figma snapshot');
}
if (JSON.stringify(consumerSnapshot) !== JSON.stringify(consumerLocal)) {
  issues.push('Consumer design tokens drift from the Figma snapshot');
}

const figmaRouteCoverage = totalFigmaRoutes === 0 ? 1 : matchedFigmaRoutes / totalFigmaRoutes;
const stitchRouteCoverage = totalStitchRoutes === 0 ? 1 : matchedStitchRoutes / totalStitchRoutes;
const componentCoverage = totalComponents === 0 ? 1 : matchedComponents / totalComponents;
const stateCoverage = totalStates === 0 ? 1 : matchedStates / totalStates;

for (const [label, value] of [
  ['Figma route coverage', figmaRouteCoverage],
  ['Stitch screen-map coverage', stitchRouteCoverage],
  ['Component coverage', componentCoverage],
  ['State coverage', stateCoverage]
]) {
  if (value < threshold) {
    issues.push(`${label} ${value.toFixed(2)} is below the required ${threshold.toFixed(2)} threshold`);
  }
}

writeJson(root, 'reports/design-drift-report.json', {
  generatedAt: new Date().toISOString(),
  threshold,
  coverage: {
    figmaRoutes: { matched: matchedFigmaRoutes, total: totalFigmaRoutes, coverage: figmaRouteCoverage },
    stitchScreenMaps: { matched: matchedStitchRoutes, total: totalStitchRoutes, coverage: stitchRouteCoverage },
    components: { matched: matchedComponents, total: totalComponents, coverage: componentCoverage },
    states: { matched: matchedStates, total: totalStates, coverage: stateCoverage }
  },
  issues
});

if (issues.length > 0) {
  throw new Error(`Frontend design handoff validation failed:\n- ${issues.join('\n- ')}`);
}

console.log('Frontend design handoff validation passed.');
