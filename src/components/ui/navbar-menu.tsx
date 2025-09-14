'use client'
import React from 'react'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { Link } from 'next-transition-router'
import Image from 'next/image'

const transition = {
  type: 'spring',
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
}

export const MenuItem = ({
  setActive,
  active,
  name,
  href,
  children,
  external,
}: {
  setActive: (name: string) => void
  active: string | null
  name: string
  href: string
  external?: boolean
  children?: React.ReactNode
}) => {
  const path = usePathname()

  return (
    <div onMouseEnter={() => setActive(name)} className="relative">
      {path === href ? (
        <div className="cursor-pointer">{name}</div>
      ) : external ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {name}
        </a>
      ) : (
        <Link href={href}>{name}</Link>
      )}
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === name && (
            <div className="absolute top-[calc(100%_+_1.2rem)] left-1/2 transform -translate-x-1/2 pt-4">
              <motion.div
                transition={transition}
                layoutId="active" // layoutId ensures smooth animation
                className="bg-white  backdrop-blur-sm rounded-2xl overflow-hidden border border-black/[0.2]  shadow-xl"
              >
                <motion.div
                  layout // layout ensures smooth animation
                  className="w-max h-full p-4"
                >
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export const Menu = ({
  setActive,
  children,
}: {
  setActive: (name: string | null) => void
  children: React.ReactNode
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)} // resets the state
      className="hidden lg:flex relative rounded-full border border-transparent bg-white shadow-input  justify-center gap-6 px-8 py-6 "
    >
      {children}
    </nav>
  )
}

export const Productname = ({
  title,
  description,
  href,
  src,
}: {
  title: string
  description: string
  href: string
  src: string
}) => {
  return (
    <a href={href} className="flex space-x-2">
      <Image
        src={src}
        width={140}
        height={70}
        alt={title}
        className="shrink-0 rounded-md shadow-2xl"
      />
      <div>
        <h4 className="text-xl font-bold mb-1 text-black ">{title}</h4>
        <p className="text-neutral-700 text-sm max-w-[10rem] ">{description}</p>
      </div>
    </a>
  )
}

interface HoveredLinkProps {
  children: React.ReactNode
  href: string
  className?: string
}

export const HoveredLink = ({ children, href, ...rest }: HoveredLinkProps) => {
  const path = usePathname()
  if (path === href) return <div {...rest}>{children}</div>
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}
