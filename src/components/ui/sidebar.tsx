'use client'
import { cn } from '@/lib/utils'
import React, { useState, createContext, useContext } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconMenu2, IconX } from '@tabler/icons-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'
import Link from 'next/link'

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState(false)

  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  )
}

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  )
}

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <>
      <motion.div
        className={cn(
          'h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 w-[400px] shrink-0',
          className,
        )}
        animate={{
          width: animate ? (open ? '400px' : '60px') : '400px',
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  )
}

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar()
  return (
    <>
      <div
        className={cn(
          'px-4 py-4 md:hidden flex md:flex-col bg-neutral-100 w-[60px] shrink-0 rounded-r-3xl',
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2 className="text-neutral-800 " onClick={() => setOpen(!open)} />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              className={cn(
                'fixed h-full w-full inset-0 bg-white  p-10 z-[100] flex flex-col justify-between',
                className,
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 text-neutral-800 "
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

type LinkCategory = {
  category: string
  questions: Array<{ question: string; slug: string }>
}

export const SidebarQuestions = ({
  link,
  className,
  ...props
}: {
  link: LinkCategory[]
  className?: string
}) => {
  const { open, animate, setOpen } = useSidebar()

  return (
    <Accordion type="multiple" className={cn('w-full', className)} {...props}>
      {link.map((category, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>
            <span
              // use CSS transitions instead of toggling `display` so text fades/slides smoothly
              className={cn(
                'text-neutral-700 text-sm text-left transition-all duration-150 ease-in-out truncate',
                animate
                  ? open
                    ? 'opacity-100 w-full '
                    : 'opacity-0 w-0 pointer-events-none'
                  : 'opacity-100',
              )}
            >
              {category.category}
            </span>
          </AccordionTrigger>
          <AccordionContent className={cn('pl-4', animate ? (open ? '' : 'p-0') : ' ')}>
            <div
              // keep links in the DOM and animate opacity/translate to avoid jumpy layout
              className={cn(
                'transition-all duration-150 ease-in-out',
                animate
                  ? open
                    ? 'opacity-100 w-full h-full'
                    : 'opacity-0  w-0 h-0  pointer-events-none'
                  : 'opacity-100',
              )}
            >
              {category.questions.map((q, idx) => (
                <Link
                  key={idx}
                  href={q.slug}
                  onClick={() => setOpen(false)}
                  className="block py-1 text-sm text-neutral-600 hover:text-neutral-800 transition truncate"
                >
                  {q.question}
                </Link>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
