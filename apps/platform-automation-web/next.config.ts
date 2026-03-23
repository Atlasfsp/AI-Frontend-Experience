import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  transpilePackages: ['@bac/api-clients', '@bac/auth', '@bac/design-tokens', '@bac/ui'],
};

export default nextConfig;
