'use client'

import { ReactNode, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface SlideInProps {
  children: ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  duration?: number
  className?: string
  distance?: number
  once?: boolean
  threshold?: number
}

export default function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className = '',
  distance = 50,
  once = true,
  threshold = 0.2,
}: SlideInProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: threshold })

  // Set the initial and animate positions based on direction
  const getDirectionalVariants = () => {
    switch (direction) {
      case 'left':
        return {
          hidden: { x: distance, opacity: 0 },
          visible: { x: 0, opacity: 1 },
        }
      case 'right':
        return {
          hidden: { x: -distance, opacity: 0 },
          visible: { x: 0, opacity: 1 },
        }
      case 'down':
        return {
          hidden: { y: -distance, opacity: 0 },
          visible: { y: 0, opacity: 1 },
        }
      case 'up':
      default:
        return {
          hidden: { y: distance, opacity: 0 },
          visible: { y: 0, opacity: 1 },
        }
    }
  }

  const variants = getDirectionalVariants()

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        transition={{
          duration,
          delay,
          ease: 'easeOut',
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  )
}
