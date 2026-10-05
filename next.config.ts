import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep firebase-admin external to Next's bundler (standard recommendation for Node-native SDKs).
  // The jose override in package.json fixes jwks-rsa's ESM require bug.
  serverExternalPackages: ["firebase-admin"],

  // Public tools live at /tools/<slug>; /app is only the account area. Redirects keep old links and search results working.
  // Redirects run before the filesystem, so legacy /app/<tool> pages are never reached.
  async redirects() {
    return [
      { source: "/tools/ai-visibility-tracker/login", destination: "/login", permanent: true },
      { source: "/tools/ai-visibility-tracker/signup", destination: "/signup", permanent: true },
      { source: "/tools/ai-visibility-tracker/onboarding", destination: "/app/onboarding", permanent: true },
      { source: "/tools/ai-visibility-tracker/dashboard", destination: "/app/visibility", permanent: true },
      { source: "/tools/opengeo", destination: "/", permanent: true },
      { source: "/tools/:slug(keyword-density-checker|schema-generator|sitemap-xml-generator|sitemap-html-generator)/build", destination: "/tools/:slug", permanent: true },
      { source: "/app/audit", destination: "/tools/page-audit", permanent: true },
      { source: "/app/crawlers", destination: "/tools/ai-crawler-check", permanent: true },
      { source: "/app/ai-files", destination: "/tools/llms-txt-generator", permanent: true },
      { source: "/app/schema", destination: "/tools/schema-generator", permanent: true },
      { source: "/app/sitemap-xml", destination: "/tools/sitemap-xml-generator", permanent: true },
      { source: "/app/sitemap-html", destination: "/tools/sitemap-html-generator", permanent: true },
      { source: "/app/meta", destination: "/tools/meta-tag-preview", permanent: true },
      { source: "/app/keywords", destination: "/tools/keyword-research", permanent: true },
      { source: "/app/density", destination: "/tools/keyword-density-checker", permanent: true },
      { source: "/pricing", destination: "/#pricing", permanent: false },
    ];
  },
};

export default nextConfig;
