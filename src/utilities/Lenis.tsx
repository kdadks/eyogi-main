'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

function LenisProv() {
  useEffect(() => {
    const lenis = new Lenis()

    function raf(time: number) {
      lenis.raf(time)

      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)
  }, [])
  return null
}
export default LenisProv
