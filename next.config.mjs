/** @type {import('next').NextConfig} */
const nextConfig = {
  // خروجی استاتیک برای استفاده در WebView اندروید (Capacitor)
  output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
