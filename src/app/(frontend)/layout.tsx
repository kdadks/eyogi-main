import type { Metadata } from 'next'
import { cn } from 'src/utilities/cn'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'
import { Great_Vibes } from 'next/font/google'

import { AdminBar } from '@/components/AdminBar'
import { Navbar } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { TransitionRouterProvider } from '@/providers/TransitionRouter'
import { Toaster } from '@/components/ui/toaster'
import LenisProv from '@/utilities/Lenis'
import Footer from '@/Footer/Component'

const GreatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400', // Great Vibes only comes in 400
  variable: '--font-great-vibes',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, GreatVibes.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link rel="icon" type="image/x-icon" href="/eyogiTextLess.png" />
      </head>
      <body className="bg-gradient-to-tl from-orange-400 to-red-600">
        <TransitionRouterProvider>
          <LenisProv />
          <Providers>
            <div className="flex min-h-screen flex-col ">
              {/* <AdminBar
                adminBarProps={{
                  preview: isEnabled,
                }}
              /> */}
              <Navbar />
              <div className="pt-16 md:pt-32 min-h-screen">{children}</div>
              <Footer />
            </div>
            <Toaster />
          </Providers>
        </TransitionRouterProvider>
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
