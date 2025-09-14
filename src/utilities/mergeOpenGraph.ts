import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'eYogi Gurkul — articles, guides and resources on Hinduism, yoga and spirituality. Read posts, teachings and event updates from our community.',
  images: [
    {
      url: `${getServerSideURL()}/eyogiTextLess.png`,
    },
  ],
  siteName: 'eYogi Gurkul',
  title: 'eYogi Gurkul',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
