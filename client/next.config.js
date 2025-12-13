/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ REQUIRED for static hosting
  output: "export",

  // ✅ REQUIRED to disable server image optimization
  images: {
    unoptimized: true,
    domains: ["res.cloudinary.com"]
  }
};

module.exports = nextConfig;
