import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export function TransitionRouterProvider({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null!)
  const yellowOverlayRef1 = useRef<HTMLDivElement>(null!)
  const { pathname } = useLocation()

  return (
    <>
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
        <div className="bg-white animate-bounce-upper h-1 w-1 rounded-full" />
        <div className="bg-white animate-bounce-upper delay-100 h-1 w-1 rounded-full" />
        <div className="bg-white animate-bounce-upper delay-200 h-1 w-1 rounded-full" />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          ref={wrapperRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.15, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: 'easeInOut' } }}
          className="flex flex-col min-h-screen relative z-10"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
