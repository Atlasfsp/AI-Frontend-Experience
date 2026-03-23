import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { syncConfiguredUpstreams } from './sync-upstreams.mjs';

function writeJson(rootDir, relativePath, value) {
  const fullPath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function createTarball(rootDir, outputFile, sourcePath) {
  const result = spawnSync('tar', ['-czf', outputFile, sourcePath], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr);
  }
}

test('syncConfiguredUpstreams downloads and validates GitHub release assets', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-sync-'));
  const releaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-release-'));
  fs.mkdirSync(path.join(tempRoot, 'packages/design-tokens/src/tokens'), { recursive: true });

  writeJson(releaseRoot, 'design-system/tokens/enterprise.json', { color: { base: '#000000' } });
  writeJson(releaseRoot, 'design-system/tokens/consumer.json', { color: { base: '#ffffff' } });
  writeJson(releaseRoot, 'design-system/tokens/manifest.json', {
    schemaVersion: '1.0.0',
    artifacts: [{ artifactId: 'figma-design-tokens-enterprise', version: '1.0.0', path: 'design-system/tokens/enterprise.json' }],
  });
  const assetDir = path.join(releaseRoot, 'assets');
  fs.mkdirSync(assetDir, { recursive: true });
  const assetName = 'design-factory-figma-design-tokens-0.1.0.tgz';
  createTarball(releaseRoot, path.join(assetDir, assetName), 'design-system/tokens');
  const checksum = crypto.createHash('sha256').update(fs.readFileSync(path.join(assetDir, assetName))).digest('hex');
  writeJson(assetDir, 'integration-release-manifest.json', {
    schemaVersion: '1.0.0',
    producer: 'design-factory-figma',
    releaseTag: 'design-factory-figma/v0.1.0',
    commitSha: 'deadbeef',
    publishedAt: '2026-03-23T00:00:00.000Z',
    artifacts: [
      {
        artifactId: 'figma-design-tokens',
        kind: 'design-tokens',
        version: '1.0.0',
        assetName,
        checksumSha256: checksum,
        sourcePath: 'design-system/tokens'
      }
    ]
  });

  const fetchImpl = async (url) => {
    const href = typeof url === 'string' ? url : url.toString();
    if (href.endsWith('/repos/abiolaogu/Design-Factory_Figma/releases/latest')) {
      return new Response(
        JSON.stringify({
          tag_name: 'design-factory-figma/v0.1.0',
          assets: [
            {
              name: 'integration-release-manifest.json',
              browser_download_url: 'https://example.test/integration-release-manifest.json',
            },
            {
              name: assetName,
              browser_download_url: `https://example.test/${assetName}`,
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (href === 'https://example.test/integration-release-manifest.json') {
      return new Response(fs.readFileSync(path.join(assetDir, 'integration-release-manifest.json')), { status: 200 });
    }

    if (href === `https://example.test/${assetName}`) {
      return new Response(fs.readFileSync(path.join(assetDir, assetName)), { status: 200 });
    }

    return new Response('not found', { status: 404 });
  };

  const result = await syncConfiguredUpstreams({
    rootDir: tempRoot,
    env: {
      BAC_UPSTREAM_SOURCE_MODE: 'github-release',
      BAC_GITHUB_API_BASE_URL: 'https://example.test',
    },
    fetchImpl,
    upstreamSources: {
      schemaVersion: '1.0.0',
      upstreams: [
        {
          slug: 'design-factory-figma',
          githubRepo: 'abiolaogu/Design-Factory_Figma',
          selector: { channel: 'latest' },
          releaseManifestAsset: 'integration-release-manifest.json',
          localReleaseManifestPath: 'contracts/upstreams/design-factory-figma/integration-release-manifest.json',
          expectedAssets: [
            {
              kind: 'design-tokens',
              template: 'design-factory-figma-design-tokens-{releaseVersion}.tgz',
              packageType: 'directory',
              sourcePath: 'design-system/tokens',
              targetRoot: 'contracts/upstreams/design-factory-figma',
            },
          ],
        },
      ],
    },
    postSync: () => {},
  });

  assert.equal(result.sourceMode, 'github-release');
  assert.equal(result.consumedUpstreams[0].releaseTag, 'design-factory-figma/v0.1.0');
  assert.ok(
    fs.existsSync(path.join(tempRoot, 'contracts/upstreams/design-factory-figma/design-system/tokens/enterprise.json')),
  );
  assert.ok(fs.existsSync(path.join(tempRoot, 'compatibility/consumed-upstreams.json')));
});
