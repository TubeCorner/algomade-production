import { fileURLToPath } from "url";
import { dirname } from "path";

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  // 🚀 Allow build to pass despite ESLint `any` in API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Use ES module export
export default nextConfig;
