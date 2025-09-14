import type { Metadata } from 'next'

import type { Media, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: { doc: Partial<Post> }): Promise<Metadata> => {
  const { doc } = args || {}

  const ogImage = getImageURL(doc?.coverImage)

  const title = doc?.title ? doc?.title + ' | eYogi Gurkul' : 'eYogi Gurkul'

  return {
    description: doc?.description,
    openGraph: mergeOpenGraph({
      description: doc?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
