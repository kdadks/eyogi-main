import { getPayload } from 'payload'
import config from '@payload-config'
import RichText from '@/components/RichText'

async function Blogs() {
  const payload = await getPayload({ config })

  const result = await payload.findGlobal({
    slug: 'privacy-policy',
  })

  // if (!privacyPolicies.docs.length) {
  //   notFound()
  // }

  const privacyPolicy = result

  return (
    <div className="w-full flex justify-center pt-8 sm:pt-0 pb-4">
      <div className="bg-white container rounded-3xl p-4">
        <p className="text-4xl sm:text-6xl text-center pb-8">{privacyPolicy.title}</p>
        <RichText className="relative pb-8" data={privacyPolicy.content} enableGutter={false} />
      </div>
    </div>
  )
}

export default Blogs
