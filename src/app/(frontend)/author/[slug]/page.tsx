import type { Metadata } from 'next'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { cache } from 'react'
import { generateMeta } from '@/utilities/generateMeta'
import { CameraOff } from 'lucide-react'
import { Link } from 'next-transition-router'
import { Media } from '@/components/Media'
import { formatDateTime } from '@/utilities/formatDateTime'

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const posts = await payload.find({
      collection: 'posts',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
    })

    const params = posts.docs.map(({ slug }) => {
      return { slug }
    })

    return params || []
  } catch (error) {
    console.warn('Could not generate static params for author pages - database connection failed:', error.message)
    return []
  }
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Author({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const url = '/author/' + slug
  const author = await queryAuthorBySlug({ slug })
  const posts = await queryPostsBySlug({ slug })

  if (!author) return <PayloadRedirects url={url} />

  return (
    <div className="flex flex-grow w-full p-8 xl:p-24">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/3 p-4 h-fit min-h-24 lg:sticky lg:top-36">
          <div className="bg-white flex flex-col xl:flex-row p-4 lg:p-8 rounded-2xl gap-4">
            <div className="flex items-center justify-center xl:w-1/3 h-full w-full max-h-64">
              <div className="aspect-square flex items-center justify-center w-1/3 lg:w-full h-fit rounded-full bg-gray-400 ">
                <CameraOff className="w-1/3 h-1/3" />
              </div>
            </div>
            <div className="flex flex-col gap-4 xl:w-2/3">
              <p className="text-3xl font-bold ">{author.name}</p>
              <p>
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ipsam nulla asperiores,
                soluta saepe rem suscipit reiciendis dolor dolores aut, exercitationem eaque ad,
                unde error! Unde aliquam magni porro nulla perspiciatis?
              </p>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-2/3 xl:pl-12 overflow-y-auto flex flex-col gap-8 p-4">
          {posts.map((post, index) => (
            <Link
              className="flex w-full flex-col-reverse lg:flex-row bg-white rounded-2xl gap-4 justify-between hover:scale-x-[1.02] hover:scale-y-105 transition-transform duration-300 "
              key={index}
              href={`/blogs/${post.slug}`}
            >
              <div className="flex flex-col p-4 lg:p-8">
                {post.categories?.map((category, index) => {
                  if (typeof category === 'object') {
                    const { title: titleFromCategory } = category

                    const categoryTitle = titleFromCategory || 'Untitled category'

                    return (
                      <div
                        className="text-base lg:text-xl text-[#B1571C] font-bold uppercase"
                        key={index}
                      >
                        {categoryTitle}
                      </div>
                    )
                  }

                  return null
                })}
                <p className="text-xl lg:text-3xl font-bold py-4">{post.title}</p>
                <p className="text-sm lg:text-base"> {post.description}</p>
                <time
                  dateTime={post.publishedAt ?? ''}
                  className="flex  items-end text-[#B1571C] flex-grow"
                >
                  {formatDateTime(post.publishedAt ?? '')}
                </time>
              </div>
              <div className="relative w-full lg:max-w-[30%] aspect-[4/3] h-full rounded-t-2xl lg:rounded-tl-none lg:rounded-r-2xl overflow-hidden">
                {post.coverImage ? (
                  <Media
                    resource={post.coverImage ?? ''}
                    imgClassName="object-cover"
                    className="w-full overflow-hidden relative h-full"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center relative">
                    <CameraOff width="25%" height="25%" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const post = await queryAuthorBySlug({ slug })

  return generateMeta({ doc: post })
}

const queryAuthorBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'users',
    limit: 1,
    pagination: false,
    where: {
      name: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

const queryPostsBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      authors: true,
      publishedAt: true,
    },
    where: {
      'authors.name': {
        equals: slug,
      },
    },
  })

  return result.docs
})
