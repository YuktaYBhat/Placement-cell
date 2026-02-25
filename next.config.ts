import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: ["nodemailer", "@prisma/client", "@aws-sdk/client-s3"],
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'documents.yourdomain.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Better performance
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
