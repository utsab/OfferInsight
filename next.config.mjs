/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverActions: {
      // Only needed for cross-origin Server Action calls
      // Same-origin calls (e.g., from your Vercel domain) work without being listed here
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? [
            // Add your production domain(s) here if you need cross-origin Server Actions
            // Example: 'https://your-app.vercel.app',
            // Example: 'https://your-custom-domain.com',
          ]
        : [
            'localhost:3000', // localhost
            '192.168.1.45:3000', // Phone access via WiFi
            'https://scaling-memory-pj7rj746pv929rqg-3000.app.github.dev/', // Codespaces
          ],
    },
  },
  // Suppresses cross-origin warnings for local development (e.g., phone access via WiFi)
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.1.45',
    '192.168.1.45:3000',
  ],
};

export default nextConfig;
