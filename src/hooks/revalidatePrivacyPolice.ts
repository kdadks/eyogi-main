import { revalidatePath } from 'next/cache'
import { GlobalAfterChangeHook } from 'payload'

export const revalidatePrivacyPolicy: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context?.disableRevalidate) {
    payload.logger.info('Revalidating privacy policy page')
    revalidatePath('/privacy-policy')
  }

  return doc
}
