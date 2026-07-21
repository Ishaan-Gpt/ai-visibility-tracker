import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep firebase-admin external to Next's bundler (standard recommendation for
  // Node-native SDKs). The actual production crash (ERR_REQUIRE_ESM) was caused by
  // jwks-rsa@4.1.0's own bug: it declares jose ^6.1.3 (ESM-only) but still does a
  // plain require('jose') internally — fixed via the "jose" override in package.json
  // pinning it to a CJS-compatible 4.x. This line is a secondary, standard practice.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
