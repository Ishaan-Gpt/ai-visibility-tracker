import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin's dependency chain (jwks-rsa -> jose) breaks when Next's
  // bundler tries to trace/bundle it (ERR_REQUIRE_ESM on jose's ESM build).
  // Excluding it here leaves it as a native Node require at runtime instead.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
