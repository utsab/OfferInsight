/** @type {import('next').NextConfig} */

// LOCAL_IP from .env.local for phone/WiFi access - not set in production
const localIp = process.env.LOCAL_IP || '';
const fallbackDevIps = ['192.168.1.152'];
const devIps = [...new Set([...(localIp ? [localIp] : []), ...fallbackDevIps])];

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
            'https://offer-insight-swart.vercel.app',
            'localhost:3000', // localhost
            ...devIps.map((ip) => `${ip}:3000`), // Phone access via WiFi
          ],
    },
  },
  // Suppresses cross-origin warnings for local development (e.g., phone access via WiFi)
  allowedDevOrigins: [
    'https://offer-insight-swart.vercel.app',
    'localhost:3000',
    ...devIps.flatMap((ip) => [ip, `${ip}:3000`]),
  ],
};

export default nextConfig;
