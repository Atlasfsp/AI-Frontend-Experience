import { baseConfig } from "./packages/eslint-config/base.mjs";
import { nextConfig } from "./packages/eslint-config/next.mjs";

export default [...baseConfig, ...nextConfig];
