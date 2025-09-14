'use client'
import { cn } from '@/utilities/cn'
import type { Post } from '@/payload-types'
import { Media } from '@/components/Media'
import { Link } from 'next-transition-router'
import { CameraOff } from 'lucide-react'

export type CardPostData = Pick<
  Post,
  'publishedAt' | 'slug' | 'categories' | 'title' | 'description' | 'coverImage'
>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: string
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, publishedAt, description, coverImage, title } = doc || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space
  const href = `/${relationTo}/${slug}`

  return (
    <Link
      className={cn(
        'overflow-hidden flex flex-col gap-4 hover:cursor-pointer bg-white rounded-2xl relative group transition-all duration-300 hover:scale-[1.03]',
        className,
      )}
      href={href}
    >
      {coverImage && typeof coverImage !== 'string' && (
        <Media
          resource={coverImage}
          imgClassName="object-cover"
          className="absolute w-full aspect-[4/3] h-40 lg:h-60 xl:h-80 group-hover:h-full transition-all duration-300 opacity100 group-hover:opacity-30"
        />
      )}
      <div className="relative w-full aspect-[4/3] h-40 lg:h-60 xl:h-80">
        {!coverImage && (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center relative">
            <CameraOff width="25%" height="25%" />
          </div>
        )}
      </div>
      <div className="p-4 z-10">
        <div className="flex justify-between">
          {showCategories && hasCategories && (
            <div className="uppercase text-sm mb-4">
              {showCategories && hasCategories && (
                <div>
                  {categories?.map((category, index) => {
                    if (typeof category === 'object') {
                      const { title: titleFromCategory } = category

                      const categoryTitle = titleFromCategory || 'Untitled category'

                      const isLast = index === categories.length - 1

                      return (
                        <div
                          className="text-lg text-[#B1571C] font-bold"
                          style={{ textShadow: '1px 1px 2px white' }}
                          key={index}
                        >
                          {categoryTitle}
                          {!isLast && <div>, &nbsp;</div>}
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              )}
            </div>
          )}
          <div>
            <p
              className="text-lg text-[#B1571C] font-bold"
              style={{ textShadow: '1px 1px 2px white' }}
            >
              {new Date(publishedAt ?? '').toLocaleDateString()}
            </p>
          </div>
        </div>
        {titleToUse && (
          <div className="text-3xl font-bold" style={{ textShadow: '1px 1px 2px white' }}>
            {titleToUse}
          </div>
        )}
        {description && (
          <div className="mt-2">
            <p className="text-xl text-black/60" style={{ textShadow: '1px 1px 2px white' }}>
              {sanitizedDescription}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
