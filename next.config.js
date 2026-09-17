/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client', '@prisma/client'],
  },
  async redirects() {
    return [
      {
        source: '/archive',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig




