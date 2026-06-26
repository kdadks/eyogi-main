import { Link } from 'react-router-dom'
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
        to={href}
      >
        <div className="flex justify-between items-center w-full">
          <p className="text-2xl sm:text-3xl md:text-4xl font-medium">{title}</p>
          {icon}
        </div>
        <p className="pr-8">{text}</p>
        <div className="mt-auto flex justify-between items-center w-full">
          <div className="inline-flex items-center bg-[#121212] justify-center px-4 lg:px-6 py-2 font-semibold text-white rounded-xl transition-all duration-200 group-hover:bg-gradient-to-br group-hover:from-orange-400 group-hover:to-red-600">
            <span className="text-lg sm:text-xl md:text-2xl">{link}</span>
          </div>
        </div>
      </Link>
    </SlideIn>
  )
}
