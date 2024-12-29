/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000', // localhost
        'https://scaling-memory-pj7rj746pv929rqg-3000.app.github.dev/', // Codespaces
      ],
    },
  },
};

export default nextConfig;
