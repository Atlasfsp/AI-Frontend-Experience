import fs from 'node:fs';
import path from 'node:path';

export function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

export function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function isSemver(value) {
  return /^\d+\.\d+\.\d+$/.test(value);
}

export function parseSemver(value) {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semver: ${value}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function satisfiesRange(version, range) {
  if (range.startsWith('^')) {
    const base = parseSemver(range.slice(1));
    const candidate = parseSemver(version);
    return candidate.major === base.major && compareSemver(candidate, base) >= 0;
  }

  return version === range;
}

export function compareSemver(left, right) {
  if (left.major !== right.major) {
    return left.major - right.major;
  }
  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }
  return left.patch - right.patch;
}

export function writeText(root, relativePath, contents) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents);
}

export function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

export function copyDirectory(sourceDir, targetDir) {
  fs.rmSync(targetDir, { force: true, recursive: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

export function routePathFromPageFile(appRoot, filePath) {
  const relative = path.relative(appRoot, filePath).replace(/\\/g, '/');
  const withoutPage = relative.replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, '');
  const segments = withoutPage
    .split('/')
    .filter(Boolean)
    .filter((segment) => !segment.startsWith('('));
  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}
