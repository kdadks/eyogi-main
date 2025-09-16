import React from 'react'

import { Card, CardPostData } from '@/components/Card'

export type Props = {
  posts: CardPostData[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  // Debug: Log posts data
  console.log('CollectionArchive received posts:', posts.length)
  console.log('Posts with cover images:', posts.filter((post) => post.coverImage).length)
  posts.forEach((post, index) => {
    console.log(`Archive Post ${index + 1}:`, {
      title: post.title,
      hasCoverImage: !!post.coverImage,
      coverImageType: typeof post.coverImage,
      coverImageData:
        post.coverImage && typeof post.coverImage === 'object'
          ? { id: post.coverImage.id, url: post.coverImage.url, filename: post.coverImage.filename }
          : post.coverImage,
    })
  })

  return (
    <>
      {posts?.map((result, index) => {
        if (typeof result === 'object' && result !== null) {
          return (
            <div key={index}>
              <Card className="h-full" doc={result} relationTo="hinduism" showCategories />
            </div>
          )
        }

        return null
      })}
    </>
  )
}
