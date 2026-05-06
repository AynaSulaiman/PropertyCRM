/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'bcryptjs', 'socket.io', 'nodemailer']
  },
}

module.exports = nextConfig
