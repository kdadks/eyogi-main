import type { Metadata } from 'next'
import { cn } from '@/utilities/cn'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'
import { Great_Vibes } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { TransitionRouterProvider } from '@/providers/TransitionRouter'
import { Toaster } from '@/components/ui/toaster'
import LenisProv from '@/utilities/Lenis'
import { NetworkErrorBoundary } from '@/components/NetworkErrorBoundary'
import { LayoutWrapper } from '@/components/LayoutWrapper'

const GreatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-great-vibes',
  display: 'swap',
  fallback: ['cursive'],
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, GreatVibes.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link rel="icon" type="image/x-icon" href="/eyogiTextLess.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="bg-gradient-to-tl from-orange-400 to-red-600" suppressHydrationWarning>
        <NetworkErrorBoundary>
          <TransitionRouterProvider>
            <LenisProv />
            <Providers>
              <LayoutWrapper>{children}</LayoutWrapper>
              <Toaster />
            </Providers>
          </TransitionRouterProvider>
        </NetworkErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: { template: '%s | eYogi Gurukul', default: 'eYogi Gurukul' },
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
