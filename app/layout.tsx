import { Analytics } from '@vercel/analytics/next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
title: 'Only Peakx Scripts',
description: 'Only Peakx Scripts — Roblox Lua scripts, secure loaders, and clean UI.',
  generator: 'v0.app',
  verification: {
    google: 'ESYc6N6VJ1vsMwIz3EHj0cTKAkYu2sshzB6-OK3j0sI',
  },
  icons: {
    icon: [{ url: '/peakx-favicon.png', type: 'image/png' }],
    shortcut: ['/peakx-favicon.png'],
    apple: [{ url: '/peakx-favicon.png', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0d1018',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className="bg-background"><body className={`${geist.variable} ${geistMono.variable}`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
