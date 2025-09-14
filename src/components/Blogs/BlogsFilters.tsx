'use client'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Category } from '@/payload-types'
import { BlogsFiltersSchema } from '@/schemas/BlogsFilters'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDebounce } from '@/utilities/useDebounce'
import { useEffect } from 'react'
import { X } from 'lucide-react'

type FormSchema = z.infer<typeof BlogsFiltersSchema>

export type CustomSelectProps = {
  data: Pick<Category, 'id' | 'title'>[]
  defaultSearch: string
  defaultCategory: string
}

function BlogsFilters({ data, defaultSearch, defaultCategory }: CustomSelectProps) {
  const router = useRouter()

  const form = useForm<FormSchema>({
    resolver: zodResolver(BlogsFiltersSchema),
    defaultValues: {
      search: defaultSearch ?? '',
      category: defaultCategory ?? '',
      sort: '',
    },
  })
  const values = useWatch({ control: form.control })

  const onSubmit = (values: FormSchema) => {
    let path = `${window.location.pathname}?`
    for (const [key, value] of Object.entries(values)) {
      if (value !== '') {
        path += `${key}=${value}&`
      }
    }
    path += 'page=1' // Reset to first page on filter change
    router.push(path)
  }

  const debouncedValues = useDebounce(values, 500)
  useEffect(() => {
    onSubmit(debouncedValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValues, values])

  return (
    <form className="lg:col-span-2 xl:col-span-3 w-full grid lg:grid-cols-3 gap-4 ">
      <Input
        placeholder="Search"
        {...form.register('search')}
        className="lg:col-span-2 text-xl bg-white rounded-2xl"
      />
      <div className="flex gap-4 w-full">
        <Controller
          control={form.control}
          name={'category'}
          render={({ field }) => (
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <div className="relative w-full">
                <SelectTrigger className="w-full bg-white text-xl rounded-2xl">
                  <SelectValue placeholder={'Choose category'} className="plactext-gray-200" />
                </SelectTrigger>
                {field.value !== '' && (
                  <button
                    className="absolute cursor-pointer right-0 h-full top-1/2 z-20 flex rounded-r-2xl hover:bg-gray-200 transition-colors w-7 -translate-y-1/2 items-center justify-center bg-gray-100"
                    onClick={() => {
                      field.value = ''
                    }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <SelectContent className="rounded-2xl ">
                {data.map(({ id, title }) => (
                  <SelectItem
                    key={id}
                    value={title}
                    className="text-xl focus:bg-slate-200 rounded-2xl  transition-colors duration-300"
                  >
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {/* <Input placeholder="sort" className="w-full" {...form.register('sort')} /> */}
      </div>
    </form>
  )
}

export default BlogsFilters
