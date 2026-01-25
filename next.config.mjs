/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  webpack: (config) => {
    // Disable canvas dependency for PDF.js (not needed for annotation extraction)
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
