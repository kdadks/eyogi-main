'use client'

import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'

const marqueeVariants = {
  animate: {
    x: ['100%', '-100%'],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: 'loop',
        duration: 20,
        ease: 'linear',
      },
    },
  },
}

type MarqueeProps = {
  text: string
  className?: string
}

function Marquee({ text, className }: MarqueeProps) {
  return (
    <motion.div
      className={twMerge(`whitespace-nowrap text-4xl font-bold uppercase text-black`, className)}
      variants={marqueeVariants}
      animate="animate"
    >
      <span>{text}</span>
      <span>{text}</span>
    </motion.div>
  )
}
export default Marquee
