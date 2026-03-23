import consumerTokens from './tokens/consumer.json';
import enterpriseTokens from './tokens/enterprise.json';

import { DesignTokensSchema } from './schema';

export { DesignTokensSchema } from './schema';
export type { DesignTokens } from './schema';
export {
  createCssVariableBlock,
  themeAttribute,
  tokenSetToCssVariables,
  tokenSetToTailwindTheme,
} from './transform';

export const tokenSets = {
  consumer: DesignTokensSchema.parse(consumerTokens),
  enterprise: DesignTokensSchema.parse(enterpriseTokens),
} as const;
