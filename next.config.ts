import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  // ✅ Official way (Next.js 15.3+ supports this gradually)
  allowedDevOrigins: ['http://localhost:9002', 'http://192.168.72.105:9002'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
