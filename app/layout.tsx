import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Skyfall',
  description: 'Modern coffee shop point of sale system for managing tables, inventory, and orders',
  generator: 'v0.app',

  manifest: '/manifest.json',
  themeColor: '#000000',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Coffee POS',
  },

  icons: {
    icon: [
      {
        url: '/skyfall-logo.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/skyfall-logo-dark.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/skyfall-logo.png',
        type: 'image/png',
      },
    ],
    apple: '/skyfall-logo.png',
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster  position="top-right"/>
        <Analytics />
      </body>
    </html>
  )
}
