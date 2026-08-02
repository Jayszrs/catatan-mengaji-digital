import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep tracing scoped to this project when another package-lock.json exists
  // higher in the Windows user directory.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
