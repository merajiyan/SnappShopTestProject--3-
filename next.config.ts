import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporary workaround: product work often lands late in the sprint and type fixes are handled separately.
    ignoreBuildErrors: false
  }
};

export default nextConfig;
