/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@chrisgawbill/vision-engine'],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals.push('@chrisgawbill/vision-engine', 'sharp');
    }
    return config;
  },
};

module.exports = nextConfig;
