import { Analytics } from '@vercel/analytics/next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Luashield — Roblox Lua Obfuscator',
  description: 'Protect and obfuscate your Roblox Lua scripts directly in your browser.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0d1018',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className="bg-background"><body className={`${geist.variable} ${geistMono.variable}`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
