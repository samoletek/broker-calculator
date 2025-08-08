import { type NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_RUNTIME_CONFIG: 'true'
  },
  images: {
    domains: ['api.placeholder.com'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://18.227.107.26 https://18.227.107.26 https://*.wix.com https://*.editorx.com https://*.wordpress.com http://localhost:* https://localhost:*",
          },
        ],
      },
    ]
  },
}

export default config