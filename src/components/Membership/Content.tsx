'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import { Membership } from '@/payload-types'

type ContentProps = {
  memberships: Membership[]
}

function Content({ memberships }: ContentProps) {
  const [activeTab, setActiveTab] = useState<Membership['title']>('volunteer')

  return (
    <Tabs defaultValue="volunteer" className="container flex-col flex gap-8">
      <TabsList>
        {memberships.map((type) => (
          <TabsTrigger
            key={type.title}
            value={type.title}
            className={cn(
              'capitalize transition-all duration-500 text-sm sm:text-base md:text-lg group',
            )}
            onClick={() => setActiveTab(type.title)}
          >
            <div className="relative w-fit">
              {type.title}
              <div className="w-full absolute bottom-0 left-0 h-0.5 flex justify-end group-hover:justify-start">
                <div
                  className={cn(
                    'group-hover:w-full bg-black h-full w-0 transition-all duration-300',
                    activeTab === type.title && 'w-full',
                  )}
                ></div>
              </div>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      {memberships.map((type) => (
        <TabsContent key={type.title} value={type.title}>
          <div className="flex flex-col sm:flex-row gap-8 justify-between">
            <div className="flex flex-col">
              <p className="capitalize text-2xl sm:text-3xl md:text-4xl font-medium">
                {type.title}
              </p>
              <p className="text-base sm:text-lg md:text-xl text-[#121212]">{type.description}</p>
            </div>
            <div className="flex gap-4">
              <div className="w-full sm:w-fit">
                <Link
                  href="/donation"
                  className="relative inline-flex w-full items-center bg-[#121212] justify-center px-3 lg:px-6 py-2 overflow-hidden font-bold text-white hover:text-white border rounded-xl shadow-2xl group"
                >
                  <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-br from-orange-400 to-red-600 group-hover:opacity-100"></span>
                  <span className="absolute top-0 left-0 w-full bg-gradient-to-b from-white to-transparent opacity-5 h-1/3"></span>
                  <span className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white to-transparent opacity-5"></span>
                  <span className="absolute bottom-0 left-0 w-4 h-full bg-gradient-to-r from-white to-transparent opacity-5"></span>
                  <span className="absolute bottom-0 right-0 w-4 h-full bg-gradient-to-l from-white to-transparent opacity-5"></span>
                  <span className="absolute inset-0 w-full h-full border from-white rounded-md opacity-10"></span>
                  <span className="absolute w-0 h-0 transition-all duration-300 ease-out from-white rounded-full group-hover:w-56 group-hover:h-56 opacity-5"></span>
                  <span className="relative text-lg sm:text-xl md:text-2xl">Donation</span>
                </Link>
              </div>

              <div className="w-full sm:w-fit">
                <a
                  href="https://forms.office.com/r/jBUGVjwk1A"
                  className="relative inline-flex w-full items-center bg-[#121212] justify-center px-6 py-2 overflow-hidden font-bold text-white hover:text-white border rounded-xl shadow-2xl group"
                >
                  <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-br from-orange-400 to-red-600 group-hover:opacity-100"></span>
                  <span className="absolute top-0 left-0 w-full bg-gradient-to-b from-white to-transparent opacity-5 h-1/3"></span>
                  <span className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white to-transparent opacity-5"></span>
                  <span className="absolute bottom-0 left-0 w-4 h-full bg-gradient-to-r from-white to-transparent opacity-5"></span>
                  <span className="absolute bottom-0 right-0 w-4 h-full bg-gradient-to-l from-white to-transparent opacity-5"></span>
                  <span className="absolute inset-0 w-full h-full border from-white rounded-md opacity-10"></span>
                  <span className="absolute w-0 h-0 transition-all duration-300 ease-out from-white rounded-full group-hover:w-56 group-hover:h-56 opacity-5"></span>
                  <span className="relative text-lg sm:text-xl md:text-2xl">Join Us</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-8 text-sm sm:text-base md:text-lg">
            <p>{type.subsection.first}</p>
            <ul className="list-disc list-inside">
              {type.subsection.list.map((point, idx) => (
                <li key={idx}>{point.item}</li>
              ))}
            </ul>
            <p>{type.subsection.last}</p>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default Content
