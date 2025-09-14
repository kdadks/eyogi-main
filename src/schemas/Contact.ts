import { z } from 'zod'

export const ContactFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email('Invalid E-mail'),
  subject: z.string().min(1),
  message: z.string().min(1),
})
