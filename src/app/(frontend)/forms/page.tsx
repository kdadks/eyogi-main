import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forms',
}

async function Forms() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'formLinks',
    pagination: false,
  })

  return (
    <div className="container max-w-5xl p-4 lg:p-8 pt-16">
      <div className="bg-white flex flex-col gap-4 rounded-3xl p-4 lg:p-8">
        <h2 className="lg:text-4xl text-2xl font-bold text-center">Forms</h2>
        <div className="grid grid-cols-1 gap-4">
          {result.docs.map((form, i) => (
            <a
              key={i}
              href={form.link}
              target="_blank"
              className="relative inline-flex w-full items-center  border-orange-500 justify-center px-6 py-3 overflow-hidden duration-300 hover:text-white border rounded-xl shadow-inner group"
            >
              <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-br from-orange-400 to-red-600 group-hover:opacity-100"></span>
              <span className="absolute top-0 left-0 w-full bg-gradient-to-b from-white to-transparent opacity-5 h-1/3"></span>
              <span className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white to-transparent opacity-5"></span>
              <span className="absolute bottom-0 left-0 w-4 h-full bg-gradient-to-r from-white to-transparent opacity-5"></span>
              <span className="absolute bottom-0 right-0 w-4 h-full bg-gradient-to-l from-white to-transparent opacity-5"></span>
              <span className="absolute inset-0 w-full h-full border from-white rounded-md opacity-10"></span>
              <span className="absolute w-0 h-0 transition-all duration-300 ease-out from-white rounded-full group-hover:w-56 group-hover:h-56 opacity-5"></span>
              <span className="relative text-base sm:text-xl md:text-2xl text-center">
                {form.title}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Forms
