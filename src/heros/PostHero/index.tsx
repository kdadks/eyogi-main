import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { formatAuthors } from '@/utilities/formatAuthors'
import { Link } from 'next-transition-router'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  return (
    <div className="w-fill justify-center">
      <div className="grid grid-cols-[1fr_minmax(0,48rem)_1fr] px-4">
        {/* fill */}
        <div className="row-span-3" />
        <div className="flex justify-between gap-4 border-b border-[#B1571C] bg-white rounded-t-2xl p-4 lg:p-8">
          {hasAuthors && (
            <div className="flex gap-1 text-2xl lg:text-3xl ">
              by{' '}
              {/* <div className="flex gap-1">
                {populatedAuthors.map((author, index) => (
                  <Link
                    key={index}
                    href={`/author/${author.name}`}
                    className="text-[#B1571C] hover:text-[#B1571CAA] transition-colors duration-300"
                  >
                    {author.name}
                  </Link>
                ))}
              </div> */}
              <div className="flex gap-1">
                {populatedAuthors.map((author, index) => (
                  <p key={index} className="text-[#B1571C]">
                    {author.name}
                  </p>
                ))}
              </div>
            </div>
          )}
          {publishedAt && (
            <div className="flex flex-col gap-1">
              <time dateTime={publishedAt} className=" text-xl  lg:text-3xl text-[#B1571C]">
                {formatDateTime(publishedAt)}
              </time>
            </div>
          )}
        </div>
        {/* fill */}
        <div className="row-span-3" />
        <div className="uppercase text-xl  text-[#B1571C] font-bold bg-white pt-4 px-4 pb-4 lg:pt-8 lg:px-8">
          {categories?.map((category, index) => {
            if (typeof category === 'object' && category !== null) {
              const { title: categoryTitle } = category

              const titleToUse = categoryTitle || 'Untitled category'

              return <div key={index}>{titleToUse}</div>
            }
            return null
          })}
        </div>
        <h1 className="text-2xl lg:text-4xl font-bold bg-white rounded-b-2xl p-4 lg:p-8 pt-2 ">
          {title}
        </h1>
      </div>
    </div>
  )
}
