'use client'

import { Facebook, Linkedin, Twitter, Youtube } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/button'

export default function Hero() {
  return (
    <div className="w-full h-[calc(100svh-80px)] md:h-[calc(100vh-128px)] flex flex-col justify-between gap-8">
      <div className="relative flex overflow-x-hidden w-full  min-h-[max(20vw,200px)] items-center mt-8 lg:mt-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[200px] min-h-[200px] xl:w-[20vw] xl:h-[20vw] ">
          <Image
            src={'/eyogiTextLess.png'}
            alt="eYogi Gurukul Logo"
            fill
            sizes="(max-width: 768px) 200px, (max-width: 1280px) 200px, 20vw"
            className="border-4 border-white rounded-full"
          />

          <div className="absolute -left-[100%] md:-left-[200%] top-1/2 pl-8 lg:pl-16 xl:pl-32 whitespace-nowrap animate-marquee flex text-[12vw] xl:text-[8vw] gap-8 lg:gap-16 xl:gap-32 flex-grow-0 text-white">
            <span>Spirituality</span>
            <span>&</span>
            <span>Dharma</span>
          </div>
          <div className="absolute -left-[100%] md:-left-[200%] top-1/2 pl-8 lg:pl-16 xl:pl-32 whitespace-nowrap animate-marquee2 flex text-[12vw] xl:text-[8vw] gap-8 lg:gap-16 xl:gap-32 flex-grow-0 text-white">
            <span>Spirituality</span>
            <span>&</span>
            <span>Dharma</span>
          </div>
          <div className="absolute w-full h-full overflow-hidden rounded-full">
            <div className="absolute -left-[100%] md:-left-[200%] top-1/2 pl-8 lg:pl-16 xl:pl-32 whitespace-nowrap animate-marquee flex text-[12vw] xl:text-[8vw] gap-8 lg:gap-16 xl:gap-32 flex-grow-0 e ">
              <span>Spirituality</span>
              <span>&</span>
              <span>Dharma</span>
            </div>
            <div className="absolute -left-[100%]  md:-left-[200%] top-1/2 pl-8 lg:pl-16 xl:pl-32 whitespace-nowrap animate-marquee2 flex text-[12vw] xl:text-[8vw] gap-8 lg:gap-16 xl:gap-32 flex-grow-0  ">
              <span>Spirituality</span>
              <span>&</span>
              <span>Dharma</span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex justify-center items-center text-center flex-col gap-8 lg:gap-16 px-4">
        <p className="text-base md:text-2xl lg:w-1/2 font-medium italic font-mono text-white max-w-[800px]">
          Preserving ancient wisdom, inspiring young minds. Accessible, values-based education for
          brigher future.
        </p>
        <div className="flex gap-4 lg:gap-8">
          <Button
            className="text-lg md:text-2xl bg-white text-orange-700 hover:scale-105 transition-transform rounded-xl hover:bg-white"
            size="lg"
            asChild
          >
            <Link href="/about">Learn More</Link>
          </Button>
          <Button
            className="text-lg md:text-2xl hover:scale-105 bg-transparent text-white hover:bg-white hover:text-red-600 border-2 transition-all border-white rounded-xl"
            size="lg"
            asChild
          >
            <Link href="/donation">Donate</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-row justify-between p-4 lg:p-16 text-white gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-lg md:text-2xl">office@eyogigurukul.com</p>
          <div className="flex lg:justify-between gap-4">
            <Link
              href="http://www.linkedin.com/in/eyogi-gurukul-7a63a91a0"
              className="hover:opacity-80 transition-opacity duration-300 flex items-center"
            >
              <Linkedin className="w-6 h-6 md:w-8 md:h-8" />
            </Link>
            <Link
              href={'http://www.twitter.com/@eyogigurukul'}
              className="hover:opacity-80 transition-opacity duration-300"
            >
              <Twitter className="w-6 h-6 md:w-8 md:h-8" />
            </Link>
            <Link
              href={'https://www.facebook.com/allfestivesireland#'}
              className="hover:opacity-80 transition-opacity duration-300"
            >
              <Facebook className="w-6 h-6 md:w-8 md:h-8" />
            </Link>
            <Link
              href={'https://www.youtube.com/channel/UCTytB2My0xSvNmtKBRIJnIg?'}
              className="hover:opacity-80 transition-opacity duration-300"
            >
              <Youtube className="w-6 h-6 md:w-8 md:h-8" />
            </Link>
          </div>
        </div>
        <div className="flex justify-end items-center animate-bounce [animation-duration:1500ms] gap-4 pt-8">
          <p className="text-2xl font-medium italic font-mono hidden md:block">Scroll down</p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="border-2 border-white rounded-full w-8 h-8 p-1"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>
      </div>
    </div>
  )
}
