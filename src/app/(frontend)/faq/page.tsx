import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Page() {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'Faq',
      limit: 1,
      pagination: false,
      select: {
        slug: true,
      },
    })

    if (result.docs.length > 0 && result.docs[0].slug) {
      redirect(`/faq/${result.docs[0].slug}`)
    }
  } catch (e: any) {
    if (e?.digest?.startsWith('NEXT_REDIRECT') || e?.message === 'NEXT_REDIRECT') {
      throw e
    }
    console.warn('FAQ lookup error on /faq page:', e)
  }

  return (
    <div className="container flex flex-col items-center justify-center py-16 text-center">
      <div className="p-8 max-w-xl rounded-2xl bg-white text-black shadow-md">
        <h2 className="text-2xl font-bold mb-3">Frequently Asked Questions</h2>
        <p className="text-gray-600">
          Please select a question from the sidebar to view detailed information.
        </p>
      </div>
    </div>
  )
}

