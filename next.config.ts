import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
    allowedDevOrigins: ["192.168.100.159"],
};

export default nextConfig;