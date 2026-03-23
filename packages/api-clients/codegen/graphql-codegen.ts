export const hasuraCodegenConfig = {
  schema: process.env.NEXT_PUBLIC_BAC_HASURA_URL ?? 'http://localhost:8082/v1/graphql',
  documents: ['src/platform/**/*.graphql'],
  generates: {
    'src/generated/platform/types.ts': {
      plugins: ['typescript', 'typescript-operations'],
    },
  },
} as const;
