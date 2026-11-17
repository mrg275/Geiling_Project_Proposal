import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dummy-data build: nothing to fetch, so every route can be statically rendered.
  reactStrictMode: true,
  // This app sits in a subdirectory of a wider repo; pin the workspace root so
  // Turbopack does not walk up and guess.
  turbopack: { root: __dirname },
};

export default nextConfig;
