import { revalidatePath } from 'next/cache'
import { CollectionAfterDeleteHook } from 'payload'
import { CollectionAfterChangeHook } from 'payload'

export const revalidateForms: CollectionAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    // Revalidate the about page where the gallery is displayed
    payload.logger.info('Revalidating forms')
    revalidatePath('/forms')
  }
  return doc
}

export const revalidateFormsDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    // Revalidate the about page where the gallery is displayed
    payload.logger.info('Revalidating forms')
    revalidatePath('/forms')
  }
  return doc
}
