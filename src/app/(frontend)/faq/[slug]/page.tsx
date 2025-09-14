import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Answer from '@/components/Faq/answer'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    select: {
      answer: true,
      question: true,
    },
    limit: 1,
    collection: 'Faq',
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return (
    <div className="container flex flex-col gap-8 items-center">
      <p className="p-4 lg:p-8 text-xl lg:text-2xl max-w-[52rem] rounded-2xl bg-white text-black w-full font-semibold">
        {result.docs[0].question}
      </p>
      <Answer data={result.docs[0].answer} />
    </div>
  )
}
