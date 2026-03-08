import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingIncludes: {
    '/api/**': ['./docs/_AGENTS/**/*'],
    '/conversations/**': ['./docs/_AGENTS/**/*'],
  },
};

export default nextConfig;
