/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["jsdom", "@mozilla/readability", "canvas"],
};

export default nextConfig;
