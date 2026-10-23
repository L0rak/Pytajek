import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ukrywa kółko Next.js w lewym dolnym rogu (widoczne tylko w trybie dev), m.in. na ekranie dziecka.
  devIndicators: false,
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
