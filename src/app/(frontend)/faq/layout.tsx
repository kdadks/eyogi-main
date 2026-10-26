import { getPayload } from 'payload'
import configPromise from '@payload-config'
import SideBar from '@/components/Faq/sidebar'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupByCategory(questions: any[]) {
  if (!Array.isArray(questions)) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped = questions.reduce((acc: any[], obj: any) => {
    const categoryTitle =
      (typeof obj?.categories === 'object' && obj?.categories?.title) ||
      (typeof obj?.categories === 'string' && obj.categories) ||
      'General'
    let categoryGroup = acc.find((group) => group.category === categoryTitle)

    if (!categoryGroup) {
      categoryGroup = { category: categoryTitle, questions: [] }
      acc.push(categoryGroup)
    }

    categoryGroup.questions.push(obj)
    return acc
  }, [])

  return grouped
}

export const metadata: Metadata = {
  title: 'FAQ',
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  let docs: any[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      depth: 1,
      collection: 'Faq',
      pagination: false,
    })
    docs = result?.docs || []
  } catch (err) {
    console.error('Error fetching FAQ list in layout:', err)
  }

  const data = groupByCategory(docs).sort((a, b) => {
    const nameA = String(a?.category || '').toUpperCase()
    const nameB = String(b?.category || '').toUpperCase()
    return nameA.localeCompare(nameB)
  })

  return (
    <div
      className={
        'mx-auto flex w-full flex-1 flex-col overflow-hidden md:flex-row h-fit md:h-[calc(100vh-150px)] pt-8 md:pt-0 gap-4 md:gap-0'
      }
    >
      <SideBar data={data} />
      <div className="flex flex-1">{children}</div>
    </div>
  )
}
