'use client'

import RichText from '@/components/RichText'

type AnswerProps = {
  data: {
    [k: string]: unknown
    root: {
      type: string
      children: {
        type: string
        version: number
        [k: string]: unknown
      }[]
      direction: ('ltr' | 'rtl') | null
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
      indent: number
      version: number
    }
  }
}

export default function Answer({ data }: AnswerProps) {
  return (
    <RichText
      className="relative max-w-[52rem] mx-auto text-black bg-white rounded-2xl p-4 lg:p-8 w-full"
      data={data}
      enableGutter={false}
    />
  )
}
