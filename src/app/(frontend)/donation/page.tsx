import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import RichText from '@/components/RichText'

export const metadata: Metadata = {
  title: 'Donation',
}

async function Donation() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.findGlobal({
    slug: 'donation',
  })

  return (
    <div className="container p-4 lg:p-8 pt-16 lg:pt-0">
      <section className="bg-white p-6 lg:p-10 rounded-3xl shadow-xl space-y-8">
        <RichText data={result.content} enableGutter={false} />
      </section>
    </div>
  )
}

export default Donation
