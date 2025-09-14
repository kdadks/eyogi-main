'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { Mail, MapPin, Phone, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContactFormSchema } from '@/schemas/Contact'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

type FormSchema = z.infer<typeof ContactFormSchema>

export default function ContactForm() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = async (values: FormSchema) => {
    setLoading(true)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (res.ok) {
      } else {
        throw new Error('Failed to send message')
      }
    } catch (e) {
      console.log(e)
    } finally {
      toast({
        title: 'Email Sent Successfully!',
        description: 'Your message has been sent!',
        variant: 'success',
      })
      setLoading(false)
      form.reset()
    }
  }

  return (
    <div className="w-full gap-8 lg:gap-16 flex flex-col-reverse lg:flex-row flex-grow lg:px-16 text-white">
      <div className="w-full md:w-[400px] p-4 flex flex-col flex-grow gap-4 lg:gap-12 justify-center">
        <div className="text-2xl lg:text-4xl">CONTACT INFORMATION</div>
        <div className="flex gap-4 items-center relative group py-1">
          <MapPin width={32} height={32} />{' '}
          <span className="text-base lg:text-2xl">Dublin, Ireland</span>
          <div className="w-full absolute -bottom-[2px] left-0 h-0.5 flex justify-end group-hover:justify-start">
            <div className="group-hover:w-full bg-white h-full w-0 transition-all duration-300"></div>
          </div>
        </div>
        <div className="flex gap-4 items-center relative group py-1">
          <Mail width={32} height={32} />{' '}
          <span className="text-base lg:text-2xl">info@eyogigurukul.com</span>
          <div className="w-full absolute -bottom-[2px] left-0 h-0.5 flex justify-end group-hover:justify-start">
            <div className="group-hover:w-full bg-white h-full w-0 transition-all duration-300"></div>
          </div>
        </div>
        <div className="flex gap-4 items-center relative group py-1">
          <Phone width={32} height={32} /> <span className="text-base lg:text-2xl">+123123123</span>
          <div className="w-full absolute -bottom-[2px] left-0 h-0.5 flex justify-end group-hover:justify-start">
            <div className="group-hover:w-full bg-white h-full w-0 transition-all duration-300"></div>
          </div>
        </div>
        <a
          href={
            'https://forms.office.com/Pages/ResponsePage.aspx?id=OG2m2PXO8kyW-C1MOQ-PtpBfnOh6BV1Fqyzs_B1hBe5UQzBBUVYwNk5FWE9aNDczVUozTVFMRkszNi4u&embed=true'
          }
          target="_blank"
          className="flex gap-4 items-center relative group py-1"
        >
          <UserPlus width={32} height={32} />{' '}
          <span className="text-base lg:text-2xl">Registration form</span>
          <div className="w-full absolute -bottom-[2px] left-0 h-0.5 flex justify-end group-hover:justify-start">
            <div className="group-hover:w-full bg-white h-full w-0 transition-all duration-300"></div>
          </div>
        </a>
      </div>
      <div className="w-full lg:w-[calc(100%-464px)] p-4 lg:p-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex justify-between gap-4 flex-col h-full"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col-reverse border-b border-white w-full">
                      <input
                        placeholder="Name"
                        className="peer bg-transparent outline-none w-full border-0 duration-500 placeholder:text-white/70 relative placeholder:duration-500 placeholder:absolute focus:placeholder:pt-[60px] focus:placeholder:opacity-0 text-6xl focus:shadow-none focus:rounded-md"
                        type="text"
                        {...field}
                      />
                      <span
                        className={cn(
                          'duration-500 opacity-0 peer-focus:opacity-100  text-base lg:text-[2vw] -translate-y-12 peer-focus:translate-y-0 -z-10',
                          form.getValues('name') && 'translate-y-0 opacity-100',
                        )}
                      >
                        Name
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col-reverse border-b border-white w-full">
                      <input
                        placeholder="Email"
                        className="peer bg-transparent outline-none w-full border-0 duration-500 placeholder:text-white/70  relative placeholder:duration-500 placeholder:absolute focus:placeholder:pt-[60px] focus:placeholder:opacity-0 text-6xl focus:shadow-none focus:rounded-md "
                        type="text"
                        {...field}
                      />
                      <span
                        className={cn(
                          'duration-500 bg-transparent opacity-0 peer-focus:opacity-100  text-base lg:text-[2vw] -translate-y-12 peer-focus:translate-y-0 -z-10',
                          form.getValues('email') && 'translate-y-0 opacity-100',
                        )}
                      >
                        Email
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col-reverse border-b border-white w-full">
                      <input
                        placeholder="Subject"
                        className="peer bg-transparent outline-none w-full border-0 duration-500 relative placeholder:text-white/70 placeholder:duration-500 placeholder:absolute focus:placeholder:pt-[60px] focus:placeholder:opacity-0 text-6xl focus:shadow-none focus:rounded-md "
                        type="text"
                        {...field}
                      />
                      <span
                        className={cn(
                          'duration-500 opacity-0 peer-focus:opacity-100 text-base lg:text-[2vw] -translate-y-12 peer-focus:translate-y-0 -z-10',
                          form.getValues('subject') && 'translate-y-0 opacity-100',
                        )}
                      >
                        Subject
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col-reverse border-b border-white w-full">
                      <textarea
                        data-lenis-prevent
                        placeholder="Message"
                        rows={3}
                        className="peer bg-transparent outline-none w-full border-0 duration-500 relative placeholder:text-6xl  placeholder:text-white/70 placeholder:duration-500 placeholder:absolute focus:placeholder:pt-[60px] focus:placeholder:opacity-0 text-xl focus:shadow-none focus:rounded-md "
                        {...field}
                      />
                      <span
                        className={cn(
                          'duration-500 opacity-0 peer-focus:opacity-100  text-base lg:text-[2vw] -translate-y-12 peer-focus:translate-y-0 -z-10',
                          form.getValues('message') && 'translate-y-0 opacity-100',
                        )}
                      >
                        Message
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex w-full justify-end">
              <button
                className="w-fit text-5xl relative group disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Send
                <div className="w-full absolute -bottom-[2px] left-0 h-1 flex justify-end group-hover:justify-start">
                  <div className="group-hover:w-full bg-white h-full w-0 transition-all duration-300"></div>
                </div>
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
