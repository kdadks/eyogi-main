import React from 'react'

import { Card, CardPostData } from '@/components/Card'

export type Props = {
  posts: CardPostData[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

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
