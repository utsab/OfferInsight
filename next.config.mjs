/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000', // localhost
        '192.168.1.52:3000', // Phone access via WiFi
        'https://scaling-memory-pj7rj746pv929rqg-3000.app.github.dev/', // Codespaces
      ],
    },
  },
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.1.52',
    '192.168.1.52:3000',
  ],
};

export default nextConfig;
