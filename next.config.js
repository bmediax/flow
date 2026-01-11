const path = require('path')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
})

const IS_DOCKER = process.env.DOCKER

/**
 * @type {import('next').NextConfig}
 **/
const config = {
  transpilePackages: [
    '@material/material-color-utilities',
  ],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@flow/epubjs/types': path.resolve(__dirname, 'lib/epubjs/types'),
      '@flow/epubjs': path.resolve(__dirname, 'lib/epubjs/src'),
      '@flow/internal': path.resolve(__dirname, 'lib/internal/src'),
      '@flow/tailwind': path.resolve(__dirname, 'lib/tailwind/src'),
      '@flow/reader': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },
  ...(IS_DOCKER && {
    output: 'standalone',
  }),
}

module.exports = withPWA(withBundleAnalyzer(config))
