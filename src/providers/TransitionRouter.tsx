'use client'

import { useRef } from 'react'
import { TransitionRouter } from 'next-transition-router'
import { animate } from 'framer-motion/dom'
import { motion } from 'framer-motion'

export function TransitionRouterProvider({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null!)
  const yellowOverlayRef1 = useRef<HTMLDivElement>(null!)

  return (
    <TransitionRouter
      auto
      leave={async (next) => {
        await animate(
          yellowOverlayRef1.current,
          { scale: [0, 8], opacity: [1], x: '-50%', y: '-50%' },
          { duration: 0.5, ease: 'easeInOut' },
        )
        next()
      }}
      enter={(next) => {
        animate(
          yellowOverlayRef1.current,
          { scale: [8, 0], x: '-50%', y: '-50%' },
          { duration: 0.5, ease: 'easeInOut' },
        )
        animate(
          wrapperRef.current,
          { opacity: [0, 1] },
          { duration: 0.3, delay: 0.15, ease: 'easeOut', onComplete: next },
        )
      }}
    >
      <motion.div
        ref={yellowOverlayRef1}
        className="fixed z-50 pointer-events-none opacity-0 flex items-center justify-center gap-[1px]"
        style={{
          background: 'linear-gradient(to right, #fb923c, #ef4444)',
          width: 'max(20vw,20vh)',
          height: 'max(20vw,20vh)',
          borderRadius: '50%',
          position: 'fixed',
          top: '50%',
          left: '50%',
        }}
      >
        <div className="bg-white animate-bounce-upper h-1 w-1  rounded-full" />
        <div className="bg-white animate-bounce-upper delay-100 h-1 w-1 rounded-full" />
        <div className="bg-white animate-bounce-upper delay-200 h-1 w-1 rounded-full" />
      </motion.div>

      <div ref={wrapperRef} className="flex flex-col min-h-screen relative z-10 ">
        {children}
      </div>
    </TransitionRouter>
  )
}
