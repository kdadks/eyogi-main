'use client'

import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import SlideIn from '../SlideIn'
import React from 'react'

export default function MainCard({
  title,
  text,
  icon,
  index,
  link,
  href,
}: {
  title: string
  text: string
  icon: React.ReactNode
  index: number
  link: string
  href: string
}) {
  return (
    <SlideIn delay={index * 0.2}>
      <Link
        className={twMerge(
          `relative w-full bg-white flex flex-col items-start justify-start rounded-3xl cursor-pointer group overflow-hidden px-6 md:px-12 py-4 lg:py-8 gap-8`,
          index === 1 ? 'lg:mt-[100px]' : '',
          index === 2 ? 'lg:mt-[200px]' : '',
        )}
        href={href}
      >
        <div className="flex justify-between items-center w-full">
          <p className="text-2xl sm:text-3xl md:text-4xl font-medium">{title}</p>
          {icon}
        </div>
        <p className="pr-8">{text}</p>
        <div className="mt-auto flex justify-between items-center w-full">
          <div className="relative inline-flex w-fit items-center bg-[#121212] justify-center px-3 lg:px-6 py-2 overflow-hidden font-bold text-white hover:text-white border rounded-xl shadow-2xl group">
            <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-br from-orange-400 to-red-600 group-hover:opacity-100"></span>
            <span className="absolute top-0 left-0 w-full bg-gradient-to-b from-white to-transparent opacity-5 h-1/3"></span>
            <span className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white to-transparent opacity-5"></span>
            <span className="absolute bottom-0 left-0 w-4 h-full bg-gradient-to-r from-white to-transparent opacity-5"></span>
            <span className="absolute bottom-0 right-0 w-4 h-full bg-gradient-to-l from-white to-transparent opacity-5"></span>
            <span className="absolute inset-0 w-full h-full border from-white rounded-md opacity-10"></span>
            <span className="absolute w-0 h-0 transition-all duration-300 ease-out from-white rounded-full group-hover:w-56 group-hover:h-56 opacity-5"></span>
            <span className="relative text-lg sm:text-xl md:text-2xl">{link}</span>
          </div>
        </div>
      </Link>
    </SlideIn>
  )
}
