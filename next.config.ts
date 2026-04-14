import type { NextConfig } from "next";

import { baseSecurityHeaders, privatePageHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [
      {
        source: "/",
        headers: privatePageHeaders.map((header) => ({ ...header })),
      },
      {
        source: "/decisions",
        headers: privatePageHeaders.map((header) => ({ ...header })),
      },
      {
        source: "/decisions/:path*",
        headers: privatePageHeaders.map((header) => ({ ...header })),
      },
      {
        source: "/:path*",
        headers: baseSecurityHeaders.map((header) => ({ ...header })),
      },
    ];
  },
};

export default nextConfig;
