// Server-only helper to enqueue a transactional email without going through
// the user-authenticated /lovable/email/transactional/send route.
// Use this from webhooks, cron jobs, and other server-side triggers.
import * as React from 'react'
import { render } from '@react-email/components'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'firstclassfits'
const SENDER_DOMAIN = 'notify.firstclassfits.co'
const FROM_DOMAIN = 'notify.firstclassfits.co'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sendInternalEmail(opts: {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData?: Record<string, any>
}): Promise<{ success: boolean; reason?: string }> {
  const template = TEMPLATES[opts.templateName]
  if (!template) {
    console.error('Unknown template', opts.templateName)
    return { success: false, reason: 'unknown_template' }
  }

  const effectiveRecipient = (template.to ?? opts.recipientEmail).trim().toLowerCase()
  if (!effectiveRecipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveRecipient)) {
    return { success: false, reason: 'invalid_recipient' }
  }

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const messageId = crypto.randomUUID()

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails')
    .select('email')
    .eq('email', effectiveRecipient)
    .maybeSingle()
  if (suppressed) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })
    return { success: false, reason: 'suppressed' }
  }

  // Unsubscribe token (upsert + read-back)
  let unsubscribeToken: string
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', effectiveRecipient)
    .maybeSingle()
  if (existing?.token && !existing.used_at) {
    unsubscribeToken = existing.token
  } else if (!existing) {
    const newToken = generateToken()
    await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .upsert({ email: effectiveRecipient, token: newToken }, { onConflict: 'email' })
    const { data: stored } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', effectiveRecipient)
      .maybeSingle()
    if (!stored) return { success: false, reason: 'token_failure' }
    unsubscribeToken = stored.token
  } else {
    return { success: false, reason: 'token_used' }
  }

  const element = React.createElement(template.component, opts.templateData ?? {})
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof template.subject === 'function' ? template.subject(opts.templateData ?? {}) : template.subject

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: opts.templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: opts.templateName,
      idempotency_key: opts.idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Enqueue failed', enqueueError)
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'enqueue failed',
    })
    return { success: false, reason: 'enqueue_failed' }
  }

  return { success: true }
}
