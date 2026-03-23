import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { copyDirectory, copyFile, writeText } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readRootJson(rootDir, relativePath) {
  return readJsonFile(path.join(rootDir, relativePath));
}

export function resolveSourceMode(env = process.env) {
  return env.BAC_UPSTREAM_SOURCE_MODE ?? (env.CI ? 'github-release' : 'workspace');
}

function extractReleaseVersion(releaseTag) {
  const match = releaseTag.match(/\/v(\d+\.\d+\.\d+)$/);
  ensure(match, `Invalid upstream release tag: ${releaseTag}`);
  return match[1];
}

function interpolateTemplate(template, releaseVersion) {
  return template.replaceAll('{releaseVersion}', releaseVersion);
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function ensureFetch(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }
  ensure(typeof globalThis.fetch === 'function', 'Global fetch is unavailable in this runtime');
  return globalThis.fetch.bind(globalThis);
}

async function fetchReleaseDescriptor({ apiBaseUrl, fetchImpl, githubRepo, selector, token }) {
  const url = selector.releaseTag
    ? `${apiBaseUrl}/repos/${githubRepo}/releases/tags/${encodeURIComponent(selector.releaseTag)}`
    : `${apiBaseUrl}/repos/${githubRepo}/releases/latest`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  ensure(response.ok, `Failed to resolve GitHub release for ${githubRepo}: ${response.status}`);
  return response.json();
}

async function downloadAssetFile({ asset, fetchImpl, token, targetFile }) {
  const response = await fetchImpl(asset.browser_download_url, {
    headers: {
      Accept: 'application/octet-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  ensure(response.ok, `Failed to download asset ${asset.name}: ${response.status}`);
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, Buffer.from(await response.arrayBuffer()));
}

function extractTarball(archivePath, targetRoot) {
  fs.mkdirSync(targetRoot, { recursive: true });
  const result = spawnSync('tar', ['-xzf', archivePath, '-C', targetRoot], {
    encoding: 'utf8',
  });
  ensure(result.status === 0, `Failed to extract ${archivePath}: ${result.stderr}`);
}

function writeConsumedUpstreams(rootDir, consumedUpstreams, sourceMode) {
  writeText(
    rootDir,
    'compatibility/consumed-upstreams.json',
    `${JSON.stringify(
      {
        schemaVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        sourceMode,
        selectedUpstreams: consumedUpstreams,
      },
      null,
      2,
    )}\n`,
  );
}

function applyWebPostSync(rootDir) {
  copyFile(
    path.join(rootDir, 'contracts/upstreams/design-factory-figma/design-system/tokens/enterprise.json'),
    path.join(rootDir, 'packages/design-tokens/src/tokens/enterprise.json'),
  );
  copyFile(
    path.join(rootDir, 'contracts/upstreams/design-factory-figma/design-system/tokens/consumer.json'),
    path.join(rootDir, 'packages/design-tokens/src/tokens/consumer.json'),
  );

  const generatedSource = path.join(rootDir, 'contracts/upstreams/ai-software-factory/gen/typescript/sdx');
  if (fs.existsSync(generatedSource)) {
    copyDirectory(generatedSource, path.join(rootDir, 'packages/api-clients/src/generated/sdx'));
  }
}

function syncWorkspaceUpstream(rootDir, upstream) {
  const workspaceRoot = path.resolve(rootDir, upstream.workspacePath);
  ensure(fs.existsSync(workspaceRoot), `Expected upstream workspace path is missing: ${workspaceRoot}`);

  for (const asset of upstream.expectedAssets) {
    const source = path.join(workspaceRoot, asset.sourcePath);
    if (asset.packageType === 'directory') {
      copyDirectory(source, path.join(rootDir, asset.targetRoot, asset.sourcePath));
    } else {
      copyFile(source, path.join(rootDir, asset.targetFile));
    }
  }

  return {
    slug: upstream.slug,
    githubRepo: upstream.githubRepo,
    channel: upstream.selector.channel ?? null,
    releaseTag: null,
    sourceMode: 'workspace',
  };
}

async function syncGitHubReleaseUpstream(rootDir, upstream, env, fetchImpl) {
  const apiBaseUrl = env.BAC_GITHUB_API_BASE_URL ?? 'https://api.github.com';
  const token = env.GITHUB_TOKEN ?? '';
  const release = await fetchReleaseDescriptor({
    apiBaseUrl,
    fetchImpl,
    githubRepo: upstream.githubRepo,
    selector: upstream.selector,
    token,
  });

  const manifestAsset = release.assets.find((asset) => asset.name === upstream.releaseManifestAsset);
  ensure(manifestAsset, `Release ${release.tag_name} is missing ${upstream.releaseManifestAsset}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${upstream.slug}-release-`));
  const manifestDownloadPath = path.join(tempDir, manifestAsset.name);
  await downloadAssetFile({
    asset: manifestAsset,
    fetchImpl,
    token,
    targetFile: manifestDownloadPath,
  });

  const releaseManifest = readJsonFile(manifestDownloadPath);
  ensure(releaseManifest.producer === upstream.slug, `Release manifest producer mismatch for ${upstream.slug}`);
  ensure(releaseManifest.releaseTag === release.tag_name, `Release manifest tag mismatch for ${upstream.slug}`);

  const releaseVersion = extractReleaseVersion(release.tag_name);
  for (const asset of upstream.expectedAssets) {
    const expectedName = interpolateTemplate(asset.template, releaseVersion);
    const githubAsset = release.assets.find((candidate) => candidate.name === expectedName);
    ensure(githubAsset, `Release ${release.tag_name} is missing expected asset ${expectedName}`);

    const manifestEntry = releaseManifest.artifacts.find((candidate) => candidate.assetName === expectedName);
    ensure(manifestEntry, `Manifest ${release.tag_name} is missing metadata for ${expectedName}`);

    const downloadPath = path.join(tempDir, expectedName);
    await downloadAssetFile({
      asset: githubAsset,
      fetchImpl,
      token,
      targetFile: downloadPath,
    });

    ensure(
      sha256File(downloadPath) === manifestEntry.checksumSha256,
      `Checksum mismatch for ${expectedName} from ${release.tag_name}`,
    );

    if (asset.packageType === 'directory') {
      fs.rmSync(path.join(rootDir, asset.targetRoot, asset.sourcePath), { force: true, recursive: true });
      extractTarball(downloadPath, path.join(rootDir, asset.targetRoot));
    } else {
      copyFile(downloadPath, path.join(rootDir, asset.targetFile));
    }
  }

  copyFile(manifestDownloadPath, path.join(rootDir, upstream.localReleaseManifestPath));

  return {
    slug: upstream.slug,
    githubRepo: upstream.githubRepo,
    channel: upstream.selector.channel ?? null,
    releaseTag: release.tag_name,
    sourceMode: 'github-release',
    assets: releaseManifest.artifacts,
  };
}

export async function syncConfiguredUpstreams({
  rootDir,
  upstreamSources,
  env = process.env,
  fetchImpl,
  postSync = () => {},
} = {}) {
  ensure(rootDir, 'rootDir is required');
  ensure(upstreamSources, 'upstreamSources is required');
  const sourceMode = resolveSourceMode(env);
  const resolvedFetch = ensureFetch(fetchImpl);
  const consumedUpstreams = [];

  for (const upstream of upstreamSources.upstreams) {
    if (sourceMode === 'workspace') {
      consumedUpstreams.push(syncWorkspaceUpstream(rootDir, upstream));
    } else if (sourceMode === 'github-release') {
      consumedUpstreams.push(await syncGitHubReleaseUpstream(rootDir, upstream, env, resolvedFetch));
    } else {
      throw new Error(`Unsupported BAC_UPSTREAM_SOURCE_MODE: ${sourceMode}`);
    }
  }

  postSync(rootDir, sourceMode);
  writeConsumedUpstreams(rootDir, consumedUpstreams, sourceMode);
  return { consumedUpstreams, sourceMode };
}

export async function syncUpstreams({ rootDir = root, env = process.env, fetchImpl } = {}) {
  const upstreamSources = readRootJson(rootDir, 'contracts/upstream-sources.json');
  return syncConfiguredUpstreams({
    rootDir,
    upstreamSources,
    env,
    fetchImpl,
    postSync: applyWebPostSync,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await syncUpstreams();
  console.log(
    `Upstream contracts and design handoff snapshots synced via ${result.sourceMode}.`,
  );
}
