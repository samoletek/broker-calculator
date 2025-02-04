import { type NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_RUNTIME_CONFIG: 'true'
  },
  images: {
    domains: ['api.placeholder.com'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}

export default config