import Content from '@/components/Membership/Content'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Membership',
}

async function Membership() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'membership',
    pagination: false,
    sort: '-created_at',
  })

  return (
    <div className="flex justify-center flex-col gap-16 items-center pb-16 pt-16 lg:pt-0">
      <div className="flex flex-col items-center container">
        <h1 className="text-3xl lg:text-6xl font-medium text-center text-white">
          Membership options
        </h1>
        <p className="text-white text-lg lg:text-2xl text-center">
          Join eYogi and make a difference in the community. Select a membership type to learn more.
        </p>
      </div>
      <Content memberships={result.docs} />
    </div>
  )
}
export default Membership
