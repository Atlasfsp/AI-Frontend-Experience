import type { NextConfig } from 'next';

import { getCacheHeaders, loadCdnConfig } from '@bac/config';

const cdn = loadCdnConfig();

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  transpilePackages: [
    '@bac/api-clients',
    '@bac/auth',
    '@bac/config',
    '@bac/design-tokens',
    '@bac/observability',
    '@bac/ui',
  ],
  assetPrefix: cdn.assetPrefix || undefined,
  images: {
    remotePatterns: cdn.imageDomains.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
    })),
  },
  async headers() {
    return getCacheHeaders();
  },
};

export default nextConfig;
