import { z } from 'zod'

export const BlogsFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.string().optional(),
})
