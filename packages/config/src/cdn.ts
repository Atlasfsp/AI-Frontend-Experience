/**
 * CDN and static asset optimization configuration.
 * Provides cache headers, asset prefix configuration, and image optimization settings.
 */

export interface CdnConfig {
  /** CDN base URL for static assets. Empty string means same-origin. */
  assetPrefix: string;
  /** Cache-Control header for immutable assets (JS, CSS, images with hash) */
  immutableMaxAge: number;
  /** Cache-Control header for HTML pages */
  pageMaxAge: number;
  /** Cache-Control stale-while-revalidate duration */
  staleWhileRevalidate: number;
  /** Image optimization domains */
  imageDomains: string[];
}

export function loadCdnConfig(): CdnConfig {
  return {
    assetPrefix: process.env.NEXT_PUBLIC_BAC_CDN_URL || '',
    immutableMaxAge: 31536000, // 1 year for hashed assets
    pageMaxAge: 60, // 1 minute for HTML
    staleWhileRevalidate: 86400, // 1 day
    imageDomains: ['cdn.stratogroup.io', 'images.stratogroup.io'],
  };
}

/**
 * Returns Next.js headers configuration for optimal caching.
 */
export function getCacheHeaders() {
  const cdn = loadCdnConfig();
  return [
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: `public, max-age=${cdn.immutableMaxAge}, immutable` },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
      ],
    },
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: `public, max-age=${cdn.pageMaxAge}, stale-while-revalidate=${cdn.staleWhileRevalidate}` },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ];
}
