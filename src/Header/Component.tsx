'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { HoveredLink, Menu, MenuItem } from '@/components/ui/navbar-menu'

interface NavLink {
  name: string
  href: string
  external?: boolean
}

const links: NavLink[] = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'About us',
    href: '/about',
  },
  {
    name: 'Hinduism',
    href: '/hinduism',
  },
  {
    name: 'SSH Portal',
    href: '/ssh-app/',
  },
  {
    name: 'Membership',
    href: '/membership',
  },
  // {
  //   name: 'Contact',
  //   href: '/contact',
  // },
  {
    name: 'Forms',
    href: '/forms',
  },
  {
    name: 'FAQ',
    href: '/faq',
  },
  {
    name: 'Donation',
    href: '/donation',
  },
  {
    name: 'Privacy Policy',
    href: '/privacy-policy',
  },
]

interface DesktopNavLink {
  name: string
  href: string
  subLinks: { name: string; href: string }[]
  external?: boolean
}

const linksDesktop: DesktopNavLink[] = [
  {
    name: 'Home',
    href: '/',
    subLinks: [],
  },
  {
    name: 'Hinduism',
    href: '/hinduism',
    subLinks: [],
  },
  {
    name: 'SSH Portal',
    href: '/ssh-app/',
    subLinks: [],
  },
  {
    name: 'About us',
    href: '/about',
    subLinks: [
      {
        name: 'Forms',
        href: '/forms',
      },
      {
        name: 'Privacy Policy',
        href: '/privacy-policy',
      },
    ],
  },

  {
    name: 'FAQ',
    href: '/faq',
    subLinks: [],
  },
  {
    name: 'Donation',
    href: '/donation',
    subLinks: [
      {
        name: 'Membership',
        href: '/membership',
      },
    ],
  },
]

const linksVariants: Variants = {
  close: {
    scaleY: 0,
    opacity: 0,
    display: 'none',
    transition: {
      display: {
        delay: 0.3,
      },
    },
  },
  open: {
    display: 'flex',
    scaleY: 1,
    opacity: 1,
  },
}

const linkVariants: Variants = {
  close: { opacity: 0, y: 40 },
  open: { opacity: 1, y: 0 },
}

export function Navbar() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [upperAnimation, setUpperAnimation] = useState({
    rotate: 0,
    translateY: 0,
  })
  const [middleAnimation, setMiddleAnimation] = useState({
    width: '1.5rem',
  })
  const [lowerAnimation, setLowerAnimation] = useState({
    rotate: 0,
    translateY: 0,
  })

  const handleOpen = () => {
    setOpen(!open)
    if (!open) {
      setUpperAnimation({ rotate: 45, translateY: 9 })
      setMiddleAnimation({ width: '0' })
      setLowerAnimation({ rotate: -45, translateY: -9 })
    } else {
      setUpperAnimation({ rotate: 0, translateY: 0 })
      setMiddleAnimation({ width: '1.5rem' })
      setLowerAnimation({ rotate: 0, translateY: 0 })
    }
  }
  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="h-28 flex w-full justify-center z-40 gap-4 px-4 lg:px-12 items-center fixed"
      >
        <div className="h-full flex w-full items-center justify-between gap-2 py-2 text-2xl font-medium sm:py-4 ">
          {path === '/' ? (
            <div className="flex items-center gap-2 h-full cursor-pointer">
              <div className="relative aspect-square h-full max-h-16 lg:max-h-24">
                <Image
                  src={'/eyogiTextLess.png'}
                  alt={''}
                  fill
                  className="border-2 border-white rounded-full object-scale-down"
                />
              </div>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2 h-full">
              <div className="relative aspect-square h-full max-h-16 lg:max-h-24">
                <Image
                  src={'/eyogiTextLess.png'}
                  alt={''}
                  fill
                  className="border-2 border-white rounded-full object-scale-down"
                />
              </div>
            </Link>
          )}

          <Menu setActive={setActive}>
            {linksDesktop.map((link) => (
              <MenuItem
                key={link.name}
                setActive={setActive}
                active={active}
                href={link.href}
                name={link.name}
                external={link.external}
              >
                <div className="flex flex-col gap-4 text-lg">
                  {link.subLinks.map((subLink) => (
                    <HoveredLink
                      key={subLink.name}
                      href={subLink.href}
                      className={cn(
                        'relative group text-neutral-700 hover:text-black duration-300 cursor-pointer',
                        path === subLink.href && 'font-medium',
                      )}
                    >
                      {subLink.name}
                      <div className="w-full absolute -bottom-[2px] left-0 h-0.5 flex justify-end group-hover:justify-start">
                        <div
                          className={cn(
                            'group-hover:w-full bg-black h-full w-0 transition-all duration-300',
                            path === subLink.href && 'w-full',
                          )}
                        ></div>
                      </div>
                    </HoveredLink>
                  ))}
                </div>
              </MenuItem>
            ))}
          </Menu>
          <div className="relative aspect-square h-full max-h-16 lg:max-h-24"></div>
          <motion.button
            className="flex flex-col items-center gap-2 lg:hidden bg-white rounded-[8px] justify-center aspect-square p-2"
            onClick={handleOpen}
            aria-label="Open navigation menu"
          >
            <motion.div className="h-[1px] w-8 bg-black" animate={upperAnimation}></motion.div>
            <motion.div className="h-[1px] w-6 bg-black" animate={middleAnimation}></motion.div>
            <motion.div className="h-[1px] w-8 bg-black" animate={lowerAnimation}></motion.div>
          </motion.button>
        </div>
      </motion.nav>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed left-0 top-0 z-30 origin-top flex h-screen w-full justify-center bg-white uppercase text-black lg:!hidden"
            variants={linksVariants}
            initial="close"
            animate="open"
            exit="close"
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
          >
            <div className="flex flex-col w-full  max-h-[calc(100vh-128px)] overflow-y-auto overflow-x-hidden items-center  gap-6 mt-24">
              {links.map((link, index) => (
                <div className="" key={index}>
                  <motion.div
                    variants={linkVariants}
                    initial="close"
                    animate="open"
                    exit="close"
                    transition={{
                      delay: 0.2 + index * 0.2,
                    }}
                    className={cn(
                      ' text-2xl uppercase ',
                      path === link.href && 'font-medium border-b-2 border-black',
                    )}
                  >
                    {link.external ? (
                      <a 
                        href={link.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={handleOpen}
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link href={link.href} onClick={handleOpen}>
                        {link.name}
                      </Link>
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
