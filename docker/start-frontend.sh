#!/bin/sh
set -eu

node -e '
const env = process.env;
const fail = (message) => {
  console.error(message);
  process.exit(1);
};
if (!["staging", "production"].includes(env.BAC_ENV) || env.BAC_ENV !== env.NEXT_PUBLIC_BAC_ENV) {
  fail("BAC_ENV and NEXT_PUBLIC_BAC_ENV must match staging or production.");
}
if (env.NEXT_PUBLIC_BAC_ENABLE_MOCK_API !== "false" || env.NEXT_PUBLIC_BAC_PROXY_THROUGH_BFF !== "true") {
  fail("Mock API must be disabled and the BFF proxy must be enabled.");
}
if (env.NEXT_PUBLIC_BAC_FEATURE_LIVE_SUBSCRIPTIONS !== "false" || env.NEXT_PUBLIC_BAC_FEATURE_PREVIEW_DEPLOYS !== "false" || env.NEXT_PUBLIC_BAC_GOVERNANCE_MODE !== "HOTL") {
  fail("Release 0 requires live subscriptions and preview deploys off, with HOTL governance.");
}
if (!["ng", "za", "eu"].includes(env.NEXT_PUBLIC_BAC_DEFAULT_REGION)) {
  fail("NEXT_PUBLIC_BAC_DEFAULT_REGION must be ng, za or eu.");
}
const secret = env.BAC_SESSION_SECRET || "";
if (secret.length < 32 || secret === "development-session-secret-change-me") {
  fail("BAC_SESSION_SECRET must be a non-default value of at least 32 characters.");
}
try {
  const callback = new URL(env.BAC_AUTH_CALLBACK_URL || "");
  const publicUrls = [
    "NEXT_PUBLIC_BAC_AUTH_BASE_URL",
    "NEXT_PUBLIC_BAC_AUTH_ISSUER_URL",
    "NEXT_PUBLIC_BAC_AUTH_AUTHORIZE_URL",
    "NEXT_PUBLIC_BAC_AUTH_TOKEN_URL",
    "NEXT_PUBLIC_BAC_AUTH_LOGOUT_URL",
    "NEXT_PUBLIC_BAC_API_URL",
    "NEXT_PUBLIC_BAC_PLATFORM_API_URL",
    "NEXT_PUBLIC_BAC_HASURA_URL",
    "NEXT_PUBLIC_BAC_SWAGGER_URL",
    "NEXT_PUBLIC_BAC_OTEL_COLLECTOR_URL",
    "NEXT_PUBLIC_BAC_SDX_API_URL",
  ];
  for (const key of publicUrls) {
    const url = new URL(env[key] || "");
    const internalApi = key === "NEXT_PUBLIC_BAC_SDX_API_URL" && url.href === "http://api:8080/";
    if (!internalApi && (url.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]", "example.com"].includes(url.hostname) || url.hostname.endsWith(".example.com"))) {
      fail("Release 0 public URLs must use approved HTTPS hosts.");
    }
  }
  if (callback.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]", "example.com"].includes(callback.hostname) || callback.hostname.endsWith(".example.com")) {
    fail("BAC_AUTH_CALLBACK_URL must use an approved HTTPS host.");
  }
} catch {
  fail("Release 0 public URLs and BAC_AUTH_CALLBACK_URL must use approved HTTPS hosts.");
}
if (!env.NEXT_PUBLIC_BAC_AUTH_CLIENT_ID?.trim()) {
  fail("NEXT_PUBLIC_BAC_AUTH_CLIENT_ID is required.");
}
'

exec node server.js
