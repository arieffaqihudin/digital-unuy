import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import nodemailer from 'nodemailer'
import { NotificationLog, SiteSetting } from '../models'

export function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

interface SendEmailInput {
  template: string
  to: string
  subject: string
  heading: string
  bodyHtml: string
  preheader?: string
  reference?: string
}

export async function sendEmail(input: SendEmailInput) {
  const config = useRuntimeConfig()
  const settings = await SiteSetting.findOne({ key: 'global' }).lean()
  const siteName =
    settings?.directorateName || 'Direktorat Tim Transformasi Digital UNU Yogyakarta'
  const html = renderEmail({
    siteName,
    heading: input.heading,
    bodyHtml: input.bodyHtml,
    preheader: input.preheader || ''
  })
  const text = stripHtml(html)

  try {
    if (!config.smtp?.host) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SMTP belum dikonfigurasi pada lingkungan produksi.')
      }
      const outbox = resolve(process.cwd(), '.data', 'mail-outbox')
      await mkdir(outbox, { recursive: true })
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
      await writeFile(
        join(outbox, fileName),
        JSON.stringify(
          {
            template: input.template,
            to: input.to,
            subject: input.subject,
            reference: input.reference || '',
            html,
            text,
            createdAt: new Date().toISOString(),
            note: 'DEVELOPMENT MAIL OUTBOX — bukan email terkirim'
          },
          null,
          2
        ),
        'utf8'
      )
      await NotificationLog.create({
        template: input.template,
        recipient: input.to,
        status: 'simulated',
        provider: 'development-outbox',
        reference: input.reference || '',
        error: ''
      })
      return { ok: true, simulated: true, fileName }
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth:
        config.smtp.user && config.smtp.pass
          ? { user: config.smtp.user, pass: config.smtp.pass }
          : undefined
    })

    await transporter.sendMail({
      from: config.smtp.from,
      to: input.to,
      subject: input.subject,
      html,
      text
    })

    await NotificationLog.create({
      template: input.template,
      recipient: input.to,
      status: 'sent',
      provider: 'smtp',
      reference: input.reference || ''
    })
    return { ok: true, simulated: false }
  } catch (error: any) {
    const safeError = String(error?.message || 'Email gagal dikirim.').slice(0, 500)
    await NotificationLog.create({
      template: input.template,
      recipient: input.to,
      status: 'failed',
      provider: config.smtp?.host ? 'smtp' : 'unconfigured',
      reference: input.reference || '',
      error: safeError
    })
    console.error('[email] failed', safeError)
    return { ok: false, simulated: false, error: safeError }
  }
}

function renderEmail({
  siteName,
  heading,
  bodyHtml,
  preheader
}: {
  siteName: string
  heading: string
  bodyHtml: string
  preheader: string
}) {
  return `<!doctype html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;background:#FAF8ED;color:#1C1A1A;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;font-size:1px;color:#FAF8ED;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8ED;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #E6E1D3;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#1C1A1A;padding:22px 28px;">
          <div style="color:#FAF8ED;font-size:15px;font-weight:700;letter-spacing:.02em;">${escapeHtml(siteName)}</div>
          <div style="color:#D7D49A;font-size:11px;letter-spacing:.16em;text-transform:uppercase;margin-top:5px;">Universitas Nahdlatul Ulama Yogyakarta</div>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <div style="height:3px;width:40px;background:#C99517;border-radius:99px;margin-bottom:20px;"></div>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1C1A1A;">${escapeHtml(heading)}</h1>
          <div style="font-size:14px;line-height:1.75;color:#4C4844;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:20px 28px;background:#FAF8ED;border-top:1px solid #E6E1D3;color:#68625C;font-size:11px;line-height:1.6;">
          Email ini dikirim otomatis oleh Digital Service Portal UNU Yogyakarta. Jangan membalas email ini.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
