/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["jsdom", "@mozilla/readability", "canvas"],
  experimental: {
    turbo: {
      resolveExtensions: [".tsx", ".ts", ".jsx", ".js"],
    },
  },
};

export default nextConfig;
