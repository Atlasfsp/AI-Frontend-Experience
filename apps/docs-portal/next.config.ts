import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@bac/design-tokens', '@bac/ui'],
};

export default nextConfig;
