#!/usr/bin/env node
// Source-only merged dependency integrity guard; no install, network or release.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT_DEPS = {
  turbo: "^2.11.10",
  typescript: "^6.0.3",
  "typescript-eslint": "^8.72.0",
  "webpack-dev-middleware": "8.5.0",
};
const NEXT_WORKSPACES = [
  "apps/docs-portal", "apps/platform-automation-web",
  "apps/software-factory-web", "packages/ui",
];
function fail(message) {
  throw new Error("POST-MERGE INTEGRITY DENIED: " + message);
}
function manifest(root, importer) {
  const name = path.join(root, importer, "package.json");
  try {
    return JSON.parse(fs.readFileSync(name, "utf8"));
  } catch (e) {
    fail("cannot parse " + name + ": " + e.message);
  }
}
function importerLines(lock, importer) {
  const rows = lock.split(/\r?\n/);
  const start = rows.indexOf("  " + importer + ":");
  if (start < 0) fail("missing lock importer " + importer);
  let end = start + 1;
  while (end < rows.length && !/^  [^\s].*:\s*$/.test(rows[end])) end++;
  return rows.slice(start + 1, end);
}
function lockedSpecifier(lock, importer, group, name) {
  const rows = importerLines(lock, importer);
  const section = rows.indexOf("    " + group + ":");
  if (section < 0) fail("missing lock group " + importer + "/" + group);
  let pos = -1;
  for (let i = section + 1; i < rows.length; i++) {
    if (/^    [^ ].*:\s*$/.test(rows[i])) break;
    if (!/^      [^ ].*:\s*$/.test(rows[i])) continue;
    const key = rows[i].slice(6).replace(/:$/, "").replace(/^['"]|['"]$/g, "");
    if (key === name) { pos = i; break; }
  }
  if (pos < 0) fail("missing lock entry " + importer + "/" + name);
  const match = rows[pos + 1]?.match(/^        specifier:\s*(.+)\s*$/);
  if (!match) fail("missing locked specifier " + importer + "/" + name);
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}
function requirePin(root, lock, importer, group, name, expected) {
  const current = manifest(root, importer)[group]?.[name];
  if (current !== expected) fail(importer + "/" + name + " manifest " + current + " != " + expected);
  const locked = lockedSpecifier(lock, importer, group, name);
  if (locked !== expected) fail(importer + "/" + name + " lock " + locked + " != " + expected);
}
export function verify(root = ROOT) {
  const base = manifest(root, ".");
  if (base.packageManager !== "pnpm@9.15.9") fail("unexpected pnpm toolchain");
  if (!base.engines?.node) fail("missing Node engine constraint");
  const lock = fs.readFileSync(path.join(root, "pnpm-lock.yaml"), "utf8");
  if (!/^lockfileVersion: '9\.0'$/m.test(lock)) fail("unexpected lockfile format");
  for (const [name, version] of Object.entries(ROOT_DEPS))
    requirePin(root, lock, ".", "devDependencies", name, version);
  for (const importer of NEXT_WORKSPACES)
    requirePin(root, lock, importer, "dependencies", "next", "^16.4.2");
  requirePin(root, lock, "packages/governed-browser", "devDependencies", "typescript", "^6.0.3");
  for (const name of ["lint", "typecheck", "test", "build", "test:integration-scripts", "test:security-audit"])
    if (!base.scripts?.[name]) fail("missing root script " + name);
  return { status: "PASS", check: "manifest/lockfile/source only",
    packageManager: base.packageManager, nextWorkspaces: NEXT_WORKSPACES,
    caveat: "Not an install, compile, E2E, security scan, staging or GA result" };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(verify(process.argv[2] ? path.resolve(process.argv[2]) : ROOT), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
