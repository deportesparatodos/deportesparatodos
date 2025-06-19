
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Enable static exports
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', // For GitHub Pages
  images: {
    unoptimized: true, // Required for static export, or configure remotePatterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

    