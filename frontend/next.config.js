/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    devIndicators: false
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8080/:path*'
      },
    ];
  },
};

module.exports = nextConfig;