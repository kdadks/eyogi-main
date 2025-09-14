/* eslint-disable @next/next/no-img-element */
'use client'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function SlideInSection() {
  const { scrollYProgress } = useScroll()

  // First animation: Width expansion
  const width = useTransform(scrollYProgress, [0, 0.3], ['0%', '100%'])

  // Second animation: Only starts after width is 100%
  const widthCircle1 = useTransform(scrollYProgress, [0.3, 0.4], ['0%', '100%'])
  const widthCircle2 = useTransform(scrollYProgress, [0.5, 0.7], ['0%', '102%'])
  const transitionX = useTransform(scrollYProgress, [0.5, 0.7], ['0', '-200%'])
  const transitionX2 = useTransform(scrollYProgress, [0.55, 0.7], ['0', '50%'])
  const opacityFirstText = useTransform(
    scrollYProgress,
    [0.4, 0.45, 0.5, 0.6],
    ['0', '1', '1', '0'],
  )
  const opacitySecendText = useTransform(scrollYProgress, [0.65, 0.7], ['0', '1'])
  const displayFirstText = useTransform(
    scrollYProgress,
    [0, 0.4, 0.401, 0.59, 0.6],
    ['none', 'none', 'block', 'block', 'none'],
  )
  const displaySecendText = useTransform(scrollYProgress, [0, 0.6, 0.61], ['none', 'none', 'block'])
  return (
    <div className="h-[calc(100vh-128px)] sticky top-32 flex items-end">
      <motion.div
        className="bg-white rounded-tr-[15vw] flex flex-col-reverse lg:flex-row gap-16 lg:gap-0 justify-end items-end lg:items-center relative p-4 lg:p-8"
        style={{ width, height: width }}
      >
        <motion.div
          className="max-lg:!translate-x-0 w-full lg:w-2/3 lg:p-8 text-xl 2xl:text-4xl max-w-7xl"
          style={{ x: transitionX2 }}
        >
          <motion.div
            style={{ opacity: opacityFirstText, display: displayFirstText }}
            className="opacity-0"
          >
            <h2 className="pb-4 text-5xl font-bold">Gurukul</h2>
            <p className="text-base md:text-2xl max-w-4xl">
              Gurukul (Sanskrit: गुरुकुल) was the main education system in ancient India with
              Shishya living near or with the guru, in the same house. The Gurukul is the first
              education system of humanity, and its origin can be traced back to over 15,000 years
              in India. Modern schools are just the evolution of the Gurukul system.
            </p>
          </motion.div>
          <motion.div
            className="xl:pl-8"
            style={{ opacity: opacitySecendText, display: displaySecendText }}
          >
            <h2 className="pb-4 text-5xl font-bold">eYogi Gurukul</h2>
            <p className="text-base md:text-2xl max-w-4xl">
              The “e” in “eYogi Gurukul” connects the ancient Vedic practices of meditation and
              Spirituality of Hinduism to the modern world of science and globalization. Therefore
              an “eYogi” is a practitioner of meditation and Spirituality who connects the ancient
              science and Spirituality of Sanatana Dharma (Eternal Laws that govern the inner world)
              to the modern world. eYogis respect other cultures and embrace integration to build
              peace and harmony in the world.
            </p>
          </motion.div>
        </motion.div>
        <div className="w-1/3 aspect-square h-fit flex items-center justify-center relative">
          <motion.div
            className="bg-white rounded-full flex items-center justify-center"
            style={{ width: widthCircle1, height: widthCircle1, x: transitionX }}
          >
            <img src="/photo1.png" alt="" className="w-full rounded-full object-cover" />
            <motion.img
              className="bg-white rounded-full w-full aspect-square absolute object-cover"
              src="/photo2.png"
              style={{ width: widthCircle2, height: widthCircle2 }}
            ></motion.img>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
