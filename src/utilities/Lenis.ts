'use client'

import { canUseDOM } from './canUseDOM'
import { ReactNode } from 'react'

let lenis: any = null

export function getLenis() {
  if (!canUseDOM) return null
  return lenis
}

export function initLenis() {
  if (!canUseDOM) return null

  if (lenis) return lenis

  try {
    const Lenis = require('lenis').default
    lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smoothWheel: true,
      smoothTouch: false,
      syncTouch: false,
    })

    const update = (time: number) => {
      lenis.raf(time * 1000)
      requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  } catch (e) {
    console.log('Lenis not available')
  }

  return lenis
}

export function destroyLenis() {
  if (lenis) {
    lenis.destroy()
    lenis = null
  }
}

export default function LenisProvider({ children }: { children?: ReactNode }) {
  return null
}
