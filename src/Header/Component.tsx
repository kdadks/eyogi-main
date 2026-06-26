
import { cn } from '@/lib/utils'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useDonationModal } from '@/contexts/DonationModalContext'

const DESKTOP_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Hinduism', href: '/hinduism' },
  { name: 'About', href: '/about' },
  { name: 'FAQ', href: '/faq' },
  { name: 'University', href: import.meta.env.VITE_SSH_URL || 'http://localhost:5174', external: true },
  { name: 'Join us', href: '/membership' },
]

const MOBILE_LINKS = [
  { name: 'Home', href: '/', external: false },
  { name: 'About Us', href: '/about', external: false },
  { name: 'Hinduism', href: '/hinduism', external: false },
  {
    name: 'University',
    href: import.meta.env.VITE_SSH_URL || 'http://localhost:5174',
    external: true,
  },
  { name: 'Membership', href: '/membership', external: false },
  { name: 'Forms', href: '/forms', external: false },
  { name: 'FAQ', href: '/faq', external: false },
  { name: 'Donation', href: '#', external: false, donate: true },
]

export function Navbar() {
  const { pathname } = useLocation()
  const { openModal } = useDonationModal()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Floating pill nav — always visible from mount */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <div
          className={cn(
            'flex items-center justify-between w-full max-w-5xl px-3 py-2 rounded-full transition-all duration-300 pointer-events-auto',
            scrolled
              ? 'bg-white shadow-md border border-stone-200/70'
              : 'bg-stone-950/30 backdrop-blur-xl border border-white/15',
          )}
        >
          {/* Logo + brand name */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 pl-1">
            <img
              src="/eyogiTextLess.png"
              alt="eYogi Gurukul"
              className={cn(
                'w-8 h-8 rounded-full object-cover transition-colors duration-300',
                scrolled ? 'border border-stone-300' : 'border border-white/25',
              )}
            />
            <span
              className={cn(
                'font-vibes text-xl hidden sm:block transition-colors duration-300',
                scrolled ? 'text-stone-800' : 'text-white/90',
              )}
            >
              eYogi Gurukul
            </span>
          </Link>

          {/* Desktop nav links — visible on md+ */}
          <nav className="hidden md:flex items-center gap-0.5">
            {DESKTOP_LINKS.map(({ name, href, external }) =>
              external ? (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                    scrolled
                      ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      : 'text-white hover:text-white hover:bg-white/15',
                  )}
                >
                  {name}
                </a>
              ) : (
                <Link
                  key={name}
                  to={href}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                    pathname === href
                      ? 'bg-amber-600 text-white'
                      : scrolled
                        ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                        : 'text-white hover:text-white hover:bg-white/15',
                  )}
                >
                  {name}
                </Link>
              )
            )}
          </nav>

          {/* Right side: CTA + burger */}
          <div className="flex items-center gap-2 pr-1">
            <button
              onClick={openModal}
              className={cn(
                'hidden md:inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                scrolled
                  ? 'bg-orange-600 text-white hover:bg-orange-500'
                  : 'bg-white/12 text-white border border-white/18 hover:bg-white/20',
              )}
            >
              Donate
            </button>

            {/* Hamburger — mobile only */}
            <button
              className={cn(
                'md:hidden flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-full transition-all duration-200 shrink-0',
                scrolled ? 'bg-stone-100 hover:bg-stone-200' : 'bg-white/10 hover:bg-white/18',
              )}
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              <span
                className={cn(
                  'block h-px w-4 transition-all duration-200',
                  open ? 'rotate-45 translate-y-[5px]' : '',
                  scrolled ? 'bg-stone-700' : 'bg-white',
                )}
              />
              <span
                className={cn(
                  'block h-px w-4 transition-all duration-200',
                  open ? 'opacity-0' : 'opacity-100',
                  scrolled ? 'bg-stone-700' : 'bg-white',
                )}
              />
              <span
                className={cn(
                  'block h-px w-4 transition-all duration-200',
                  open ? '-rotate-45 -translate-y-[5px]' : '',
                  scrolled ? 'bg-stone-700' : 'bg-white',
                )}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center md:hidden"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {/* Brand mark at top */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <img
                src="/eyogiTextLess.png"
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-stone-200"
              />
              <span className="font-vibes text-2xl text-stone-800">eYogi Gurukul</span>
            </div>

            <nav className="flex flex-col items-center gap-5">
              {MOBILE_LINKS.map(({ name, href, external, donate }) =>
                donate ? (
                  <button
                    key={name}
                    onClick={() => {
                      openModal()
                      setOpen(false)
                    }}
                    className="text-2xl font-medium text-stone-800 hover:text-orange-600 transition-colors duration-200"
                  >
                    {name}
                  </button>
                ) : external ? (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl text-stone-500 hover:text-orange-600 transition-colors duration-200"
                    onClick={() => setOpen(false)}
                  >
                    {name}
                  </a>
                ) : (
                  <Link
                    key={name}
                    to={href}
                    className={cn(
                      'text-2xl font-medium transition-colors duration-200',
                      pathname === href
                        ? 'text-orange-600'
                        : 'text-stone-800 hover:text-orange-600',
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {name}
                  </Link>
                ),
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
