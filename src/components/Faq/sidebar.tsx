'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar, SidebarBody, SidebarQuestions } from '../ui/sidebar'

type SidebarProps = Array<{
  category: string
  questions: Array<{ question: string; slug: string }>
}>

export default function SideBar({ data }: { data: SidebarProps }) {
  const [open, setOpen] = useState(false)
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody
        className={cn(
          'justify-between gap-10 md:rounded-r-3xl overflow-y-auto',
          !open && 'overflow-hidden',
        )}
        data-lenis-prevent
      >
        <div>
          <SidebarQuestions link={data} />
        </div>
      </SidebarBody>
    </Sidebar>
  )
}
