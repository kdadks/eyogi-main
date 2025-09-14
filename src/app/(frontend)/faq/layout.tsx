import { getPayload } from 'payload'
import configPromise from '@payload-config'
import SideBar from '@/components/Faq/sidebar'
import { Metadata } from 'next'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupByCategory(questions: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped = questions.reduce((acc: any, obj: any) => {
    const categoryTitle = obj.categories.title
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
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    select: {
      categories: true,
      question: true,
      slug: true,
    },
    sort: '-categories.title',
    collection: 'Faq',
    pagination: false,
  })

  const data = groupByCategory(result.docs).sort((a, b) => {
    const nameA = a.category.toUpperCase()
    const nameB = b.category.toUpperCase()
    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }

    return 0
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
