import Link from 'next/link'
import React from 'react'

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>404</h1>
          <p style={{ margin: '0 0 2rem', color: '#666' }}>This page could not be found.</p>
          <Link href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
            Go home
          </Link>
        </div>
      </body>
    </html>
  )
}
