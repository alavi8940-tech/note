import type { Metadata, Viewport } from 'next'
import { Vazirmatn, Noto_Nastaliq_Urdu } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-nastaliq-src',
  display: 'swap',
})

const uthman = localFont({
  src: '../public/fonts/UthmanTN1.woff2',
  variable: '--font-uthman-src',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'دفتر راز',
  description: 'دفترچه یادداشت خصوصی و امن شما با قفل بیومتریک',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'دفتر راز',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6efdf' },
    { media: '(prefers-color-scheme: dark)', color: '#1d1712' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`bg-background ${vazirmatn.variable} ${nastaliq.variable} ${uthman.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
