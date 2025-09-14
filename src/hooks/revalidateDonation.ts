import { revalidatePath } from 'next/cache'
import { GlobalAfterChangeHook } from 'payload'

export const revalidateDonationPage: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context?.disableRevalidate) {
    payload.logger.info('Revalidating donation page')
    revalidatePath('/donation')
  }

  return doc
}
