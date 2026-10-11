import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

import { categorize, isVerifiedRemediation } from './security-audit.mjs';

const require = createRequire(import.meta.url);
const braces = require('braces');
const webpackDevMiddlewareEntry = require.resolve('webpack-dev-middleware');
const getFilenameFromUrl = require(
  path.resolve(path.dirname(webpackDevMiddlewareEntry), 'utils/getFilenameFromUrl.js'),
);

const BRACES_ADVISORY = {
  id: 1240992,
  severity: 'high',
  module_name: 'braces',
  github_advisory_id: 'GHSA-vfj7-8cjw-p6xm',
  title: 'braces nesting depth denial of service',
};

const WEBPACK_DEV_MIDDLEWARE_ADVISORY = {
  id: 1240027,
  severity: 'high',
  module_name: 'webpack-dev-middleware',
  github_advisory_id: 'GHSA-g84c-rxfj-3j2c',
  title: 'webpack-dev-middleware path traversal',
};

test('the patched braces parser rejects excessive nesting before walking the AST', () => {
  const nestedPattern = `${'{'.repeat(101)}value${'}'.repeat(101)}`;
  assert.throws(() => braces(nestedPattern), /Brace nesting depth exceeds maximum \(100\)/);
});

test('the audit records the verified braces remediation without counting it as actionable', () => {
  assert.equal(isVerifiedRemediation(BRACES_ADVISORY), true);

  const result = categorize({
    advisories: { 1240992: BRACES_ADVISORY },
    metadata: { vulnerabilities: { high: 1 } },
  });

  assert.equal(result.counts.high, 0);
  assert.equal(result.vulnerabilities.length, 0);
  assert.equal(result.remediations.length, 1);
  assert.equal(result.remediations[0].githubAdvisoryId, 'GHSA-vfj7-8cjw-p6xm');
});

test('the patched webpack middleware rejects a public-path prefix traversal', () => {
  const outputPath = '/virtual/dist';
  let statCalls = 0;
  const extra = {};
  const context = {
    options: { publicPath: '/static' },
    outputFileSystem: {
      statSync() {
        statCalls += 1;
        return { isDirectory: () => false, isFile: () => true };
      },
    },
    stats: {
      compilation: {
        getPath: (value) => value,
        outputOptions: { path: outputPath, publicPath: '/static' },
      },
    },
  };

  assert.equal(getFilenameFromUrl(context, '/static../secret.txt', extra), undefined);
  assert.equal(extra.errorCode, 403);
  assert.equal(statCalls, 0);
});

test('the audit records the verified webpack middleware remediation', () => {
  assert.equal(isVerifiedRemediation(WEBPACK_DEV_MIDDLEWARE_ADVISORY), true);

  const result = categorize({
    advisories: { 1240027: WEBPACK_DEV_MIDDLEWARE_ADVISORY },
    metadata: { vulnerabilities: { high: 1 } },
  });

  assert.equal(result.counts.high, 0);
  assert.equal(result.vulnerabilities.length, 0);
  assert.equal(result.remediations.length, 1);
  assert.equal(result.remediations[0].githubAdvisoryId, 'GHSA-g84c-rxfj-3j2c');
});

test('an advisory that does not match the verified remediation remains actionable', () => {
  const result = categorize({
    advisories: {
      1240992: { ...BRACES_ADVISORY, module_name: 'unexpected-package' },
    },
  });

  assert.equal(result.counts.high, 1);
  assert.equal(result.vulnerabilities.length, 1);
  assert.equal(result.remediations.length, 0);
});
