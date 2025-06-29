/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Netlify
  images: {
    unoptimized: true
  },

  // Variables de entorno
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
  },

  // Headers para CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ]
  },

  // Configuración para Netlify
  serverExternalPackages: ['@prisma/client', 'prisma']
}

module.exports = nextConfig
