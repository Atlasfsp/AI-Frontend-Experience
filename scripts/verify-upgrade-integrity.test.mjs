import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { verify } from "./verify-upgrade-integrity.mjs";

const rootPins = {
  turbo: "^2.11.10", typescript: "^6.0.3",
  "typescript-eslint": "^8.72.0", "webpack-dev-middleware": "8.5.0",
};
const nextPaths = [
  "apps/docs-portal", "apps/platform-automation-web",
  "apps/software-factory-web", "packages/ui",
];

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "front-upgrade-"));
  const bins = [
    { name: ".", group: "devDependencies", deps: rootPins },
    ...nextPaths.map(name => ({ name, group: "dependencies", deps: { next: "^16.4.2" } })),
    { name: "packages/governed-browser", group: "devDependencies", deps: { typescript: "^6.0.3" } },
  ];
  const entries = ["lockfileVersion: '9.0'", "", "importers:", ""];
  for (const { name, group, deps } of bins) {
    const dir = path.join(root, name);
    mkdirSync(dir, { recursive: true });
    const pkg = {
      name: name === "." ? "ai-frontend-experience" : name,
      packageManager: name === "." ? "pnpm@9.15.9" : undefined,
      engines: name === "." ? { node: ">=20.10.0" } : undefined,
      scripts: name === "." ? Object.fromEntries(
        ["lint", "typecheck", "test", "build", "test:integration-scripts", "test:security-audit"]
          .map(k => [k, "echo fixture"])
      ) : undefined,
      [group]: deps,
    };
    writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg));
    entries.push("  " + name + ":", "    " + group + ":");
    for (const [key, value] of Object.entries(deps)) {
      entries.push("      '" + key + "':", "        specifier: " + value, "        version: fixture");
    }
    entries.push("");
  }
  writeFileSync(path.join(root, "pnpm-lock.yaml"), entries.join("\n"));
  return root;
}
function useFixture(fn) {
  const root = fixture();
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function change(root, file, updater) {
  const full = path.join(root, file);
  const old = readFileSync(full, "utf8");
  writeFileSync(full, updater(old));
}

test("passes a self-consistent pinned source fixture without installing packages", () =>
  useFixture(root => {
    const result = verify(root);
    assert.equal(result.status, "PASS");
    assert.match(result.caveat, /Not an install/);
  })
);

test("rejects mismatched lockfile even if the manifest claims the correct version", () =>
  useFixture(root => {
    change(root, "pnpm-lock.yaml", s => s.replace("specifier: ^6.0.3", "specifier: ^5.9.3"));
    assert.throws(() => verify(root), /INTEGRITY DENIED/);
  })
);

test("rejects a partially upgraded Next workspace", () =>
  useFixture(root => {
    change(root, "apps/docs-portal/package.json",
      s => s.replace("16.4.2", "15.5.27"));
    assert.throws(() => verify(root), /INTEGRITY DENIED/);
  })
);

test("rejects a downgraded pnpm toolchain specification", () =>
  useFixture(root => {
    change(root, "package.json", s => s.replace("pnpm@9.15.9", "pnpm@8.0.0"));
    assert.throws(() => verify(root), /INTEGRITY DENIED/);
  })
);

test("rejects missing governance and quality scripts", () =>
  useFixture(root => {
    const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    delete manifest.scripts["test:security-audit"];
    writeFileSync(path.join(root, "package.json"), JSON.stringify(manifest));
    assert.throws(() => verify(root), /INTEGRITY DENIED/);
  })
);
