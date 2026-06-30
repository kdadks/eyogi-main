/**
 * POST /api/payments/sumup/webhook
 * 
 * Handles SumUp webhook events for payment status updates
 * Documentation: https://developer.sumup.com/online-payments/webhooks/
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    // Extract event data from SumUp webhook
    const { id: eventId, type: eventType, data } = payload

    console.log('Received SumUp webhook:', { eventId, eventType })

    // Store webhook in database for audit trail
    const { data: webhookRecord, error: webhookError } = await supabase
      .from('payment_webhooks')
      .insert({
        provider: 'sumup',
        event_type: eventType,
        event_id: eventId,
        payload,
      })
      .select()
      .single()

    if (webhookError) {
      console.error('Error storing webhook:', webhookError)
      return Response.json({ error: 'Failed to store webhook' }, { status: 500 })
    }

    // Handle checkout.completed event
    if (eventType === 'checkout.completed') {
      const checkoutId = data?.checkout_id
      const checkoutReference = data?.checkout_reference
      const status = data?.status // 'COMPLETED' or 'FAILED'

      if (!checkoutId || !checkoutReference) {
        console.error('Missing checkout data in webhook')
        return Response.json({ error: 'Missing checkout data' }, { status: 400 })
      }

      // Find payment by donation ID (checkout_reference is the donation ID)
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('donation_id', checkoutReference)
        .single()

      if (paymentError) {
        console.error('Payment not found:', paymentError)
        return Response.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status
      const paymentStatus = status === 'COMPLETED' ? 'completed' : 'failed'

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          provider_transaction_id: checkoutId,
          processed_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      if (updateError) {
        console.error('Error updating payment:', updateError)
        return Response.json({ error: 'Failed to update payment' }, { status: 500 })
      }

      // Update webhook as processed
      await supabase
        .from('payment_webhooks')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', webhookRecord.id)

      console.log(`Payment ${payment.id} updated to ${paymentStatus}`)
    }

    return Response.json({ success: true, webhook_id: webhookRecord.id })
  } catch (error) {
    console.error('Webhook processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return Response.json(
      {
        error: 'Failed to process webhook',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
