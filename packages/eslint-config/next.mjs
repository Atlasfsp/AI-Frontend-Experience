import next from '@next/eslint-plugin-next';

export const nextConfig = [
  {
    files: ['apps/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
];
