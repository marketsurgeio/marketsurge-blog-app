/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://challenges.cloudflare.com;",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle native modules
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }
    
    // Ignore canvas in client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      }
    }

    return config;
  },
};

module.exports = nextConfig; 