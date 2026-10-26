import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Answer from '@/components/Faq/answer'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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

  const faqDoc = result.docs?.[0]

  if (!faqDoc) {
    return (
      <div className="container flex flex-col gap-6 items-center py-12 text-center">
        <div className="p-6 lg:p-8 max-w-[52rem] rounded-2xl bg-white text-black w-full shadow-md">
          <h2 className="text-xl font-bold mb-2">Question not found</h2>
          <p className="text-gray-600 mb-4">
            The requested question could not be found or may have been updated.
          </p>
          <Link
            href="/faq"
            className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            View all FAQs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex flex-col gap-8 items-center">
      <p className="p-4 lg:p-8 text-xl lg:text-2xl max-w-[52rem] rounded-2xl bg-white text-black w-full font-semibold">
        {faqDoc.question}
      </p>
      {faqDoc.answer && <Answer data={faqDoc.answer} />}
    </div>
  )
}

