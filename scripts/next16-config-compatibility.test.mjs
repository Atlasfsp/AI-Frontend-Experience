// Next.js 16 removed the `eslint` next.config option. This source-level
// contract prevents reintroducing an obsolete build-time lint bypass while
// retaining explicit ESLint CLI checks in each application.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apps = [
  "apps/docs-portal",
  "apps/platform-automation-web",
  "apps/software-factory-web",
];

function hasRemovedNextESLintOption(source) {
  const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  return /(?:^|[,{\n])\s*eslint\s*:/.test(uncommented);
}

test("Next 16 app configs do not use removed eslint option; lint stays explicit", () => {
  const rootManifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(rootManifest.scripts.lint, "turbo run lint");
  for (const app of apps) {
    const source = readFileSync(path.join(root, app, "next.config.ts"), "utf8");
    const manifest = JSON.parse(readFileSync(path.join(root, app, "package.json"), "utf8"));
    assert.equal(hasRemovedNextESLintOption(source), false, app + ": removed next.config eslint option");
    assert.equal(manifest.scripts.lint, "eslint .", app + ": explicit ESLint CLI required");
    assert.equal(manifest.scripts.build, "next build", app + ": no build bypass");
    assert.match(source, /output:\s*['"]standalone['"]/, app + ": preserve production build output");
    assert.match(source, /transpilePackages:\s*\[/, app + ": preserve workspace transpilation");
  }
});

test("regression guard recognizes obsolete Next 15 lint configuration", () => {
  assert.equal(hasRemovedNextESLintOption("export default { eslint: { ignoreDuringBuilds: true } }"), true);
  assert.equal(hasRemovedNextESLintOption("const nextConfig = {\n  eslint: { ignoreDuringBuilds: true },\n}"), true);
  assert.equal(hasRemovedNextESLintOption("// eslint: { ignoreDuringBuilds: true }\nconst x = {}"), false);
  assert.equal(hasRemovedNextESLintOption("export default { reactStrictMode: true }"), false);
});
