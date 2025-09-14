import { revalidatePath } from 'next/cache'
import { GlobalAfterChangeHook } from 'payload'

export const revalidateAboutUs: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    // Revalidate the about page where the gallery is displayed
    payload.logger.info('Revalidating about page')
    revalidatePath('/about')
  }
  return doc
}
