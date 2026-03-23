import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
};

export default nextConfig;
