import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@pdf-lib/fontkit", "pdf-lib", "exceljs"],
};

export default nextConfig;
