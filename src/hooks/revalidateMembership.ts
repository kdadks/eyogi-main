import { revalidatePath } from 'next/cache'
import { CollectionAfterDeleteHook } from 'payload'
import { CollectionAfterChangeHook } from 'payload'

export const revalidateMembership: CollectionAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    // Revalidate the about page where the gallery is displayed
    payload.logger.info('Revalidating Membership')
    revalidatePath('/membership')
  }
  return doc
}

export const revalidateMembershipDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    // Revalidate the about page where the gallery is displayed
    payload.logger.info('Revalidating Membership')
    revalidatePath('/membership')
  }
  return doc
}
