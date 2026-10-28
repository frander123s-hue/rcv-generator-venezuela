import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { COMPANY_CONFIG } from '../pdf/generateRCV'

export interface SendPolicyEmailParams {
  to: string
  clientName: string
  policyNumber: string
  vehiclePlate: string
  startDate: string
  endDate: string
  pdfBuffer: Buffer
  pdfFileName: string
  verifyUrl?: string
}

export interface SendPolicyEmailResult {
  sent: boolean
  provider: 'gmail_smtp' | 'resend_direct' | 'resend_admin_copy'
  deliveredTo: string
  note?: string
}

const ADMIN_CORPORATE_EMAIL =
  process.env.ADMIN_EMAIL || 'corporacionvenezolanadegaranti@gmail.com'

export async function sendPolicyEmail({
  to,
  clientName,
  policyNumber,
  vehiclePlate,
  startDate,
  endDate,
  pdfBuffer,
  pdfFileName,
  verifyUrl,
}: SendPolicyEmailParams): Promise<SendPolicyEmailResult> {
  const cleanTo = (to || '').trim().toLowerCase()
  if (!cleanTo) {
    throw new Error('El cliente no tiene correo electrónico registrado.')
  }

  const subject = `Póliza RCV N° ${policyNumber} (${vehiclePlate}) - ${COMPANY_CONFIG.name}`
  const htmlBody = generateEmailHTML({
    clientName,
    policyNumber,
    vehiclePlate,
    startDate,
    endDate,
    verifyUrl,
  })

  // 1. Intento principal: Gmail SMTP directo desde corporacionvenezolanadegaranti@gmail.com
  // Permite enviar a CUALQUIER correo de cliente (@gmail.com, @hotmail.com, etc.) sin dominio propio.
  const gmailPass = (
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASSWORD ||
    ''
  )
    .replace(/\s+/g, '')
    .trim()

  if (gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: ADMIN_CORPORATE_EMAIL,
          pass: gmailPass,
        },
      })

      await transporter.sendMail({
        from: `"${COMPANY_CONFIG.name}" <${ADMIN_CORPORATE_EMAIL}>`,
        to: cleanTo,
        bcc:
          cleanTo !== ADMIN_CORPORATE_EMAIL.toLowerCase()
            ? ADMIN_CORPORATE_EMAIL
            : undefined,
        replyTo: ADMIN_CORPORATE_EMAIL,
        subject,
        html: htmlBody,
        attachments: [
          {
            filename: pdfFileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      })

      return {
        sent: true,
        provider: 'gmail_smtp',
        deliveredTo: cleanTo,
      }
    } catch (smtpErr: any) {
      console.warn('Gmail SMTP warning, falling back to Resend:', smtpErr?.message || smtpErr)
    }
  }

  // 2. Respaldo con Resend API
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.includes('your_resend')) {
    throw new Error(
      'No hay GMAIL_APP_PASSWORD ni RESEND_API_KEY configuradas para enviar correos.'
    )
  }

  const resend = new Resend(apiKey)
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    'Corporacion Venezolana de Garantias <onboarding@resend.dev>'

  // Intentar enviar directamente al correo del cliente
  const { error: directError } = await resend.emails.send({
    from: fromEmail,
    to: [cleanTo],
    replyTo: ADMIN_CORPORATE_EMAIL,
    subject,
    html: htmlBody,
    attachments: [
      {
        filename: pdfFileName,
        content: pdfBuffer,
      },
    ],
  })

  if (!directError) {
    return {
      sent: true,
      provider: 'resend_direct',
      deliveredTo: cleanTo,
    }
  }

  // Si Resend rechaza por estar en modo sandbox sin dominio propio (403 solo envía a corporacionvenezolanadegaranti@gmail.com),
  // enviamos automáticamente la póliza con el PDF adjunto al correo corporativo corporacionvenezolanadegaranti@gmail.com
  // para que nunca se pierda y pueda reenviarse, e informamos cómo activar GMAIL_APP_PASSWORD.
  if (cleanTo !== ADMIN_CORPORATE_EMAIL.toLowerCase()) {
    const fallbackHtml = generateEmailHTML({
      clientName,
      policyNumber,
      vehiclePlate,
      startDate,
      endDate,
      verifyUrl,
      forwardNoticeForClientEmail: cleanTo,
    })

    const { error: adminCopyError } = await resend.emails.send({
      from: fromEmail,
      to: [ADMIN_CORPORATE_EMAIL],
      subject: `[PARA REENVIAR A ${cleanTo}] ${subject}`,
      html: fallbackHtml,
      attachments: [
        {
          filename: pdfFileName,
          content: pdfBuffer,
        },
      ],
    })

    if (!adminCopyError) {
      return {
        sent: true,
        provider: 'resend_admin_copy',
        deliveredTo: ADMIN_CORPORATE_EMAIL,
        note: `Resend sin dominio propio solo entrega a ${ADMIN_CORPORATE_EMAIL}. Se envió copia con el PDF a ${ADMIN_CORPORATE_EMAIL} lista para reenviar a ${cleanTo}. Para envío directo automático a cualquier cliente desde Gmail, configura GMAIL_APP_PASSWORD.`,
      }
    }
  }

  throw new Error(`Error al enviar correo: ${directError.message}`)
}

function generateEmailHTML({
  clientName,
  policyNumber,
  vehiclePlate,
  startDate,
  endDate,
  verifyUrl,
  forwardNoticeForClientEmail,
}: {
  clientName: string
  policyNumber: string
  vehiclePlate: string
  startDate: string
  endDate: string
  verifyUrl?: string
  forwardNoticeForClientEmail?: string
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Póliza RCV Emitida</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          ${
            forwardNoticeForClientEmail
              ? `<tr>
                  <td style="background-color:#fef3c7;border-bottom:2px solid #f59e0b;padding:12px 20px;text-align:center;">
                    <p style="color:#92400e;margin:0;font-size:13px;font-weight:bold;">
                      📌 PÓLIZA GENERADA PARA EL CLIENTE: <a href="mailto:${forwardNoticeForClientEmail}" style="color:#b45309;">${forwardNoticeForClientEmail}</a>
                    </p>
                  </td>
                </tr>`
              : ''
          }
          <tr>
            <td style="background-color:#1a2e5a;padding:28px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:bold;">
                ${COMPANY_CONFIG.name}
              </h1>
              <p style="color:#c8a619;margin:6px 0 0;font-size:13px;font-weight:bold;">
                RIF: ${COMPANY_CONFIG.rif} · SUNACOOP Exp. 381558
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#16a34a;padding:12px;text-align:center;">
              <p style="color:#ffffff;margin:0;font-size:14px;font-weight:bold;">
                ✅ SU PÓLIZA DE RESPONSABILIDAD CIVIL DE VEHÍCULOS HA SIDO EMITIDA
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="font-size:15px;color:#222;margin:0 0 16px;">
                Estimado(a) <strong>${clientName}</strong>,
              </p>
              <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 22px;">
                Adjunto a este correo encontrará su <strong>Póliza RCV y sus carnets recortables en formato PDF</strong>, listos para imprimir o portar digitalmente.
              </p>
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:22px;">
                <tr>
                  <td style="font-size:13px;color:#666;">Contrato Nro.:</td>
                  <td style="font-size:13px;color:#111;font-weight:bold;">${policyNumber}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#666;">Placa del Vehículo:</td>
                  <td style="font-size:13px;color:#111;font-weight:bold;">${vehiclePlate}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#666;">Vigencia Desde:</td>
                  <td style="font-size:13px;color:#111;font-weight:bold;">${startDate}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#666;">Vigencia Hasta:</td>
                  <td style="font-size:13px;color:#111;font-weight:bold;">${endDate}</td>
                </tr>
              </table>
              ${
                verifyUrl
                  ? `<div style="text-align:center;margin:20px 0;">
                      <a href="${verifyUrl}" style="background-color:#1a2e5a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:13px;font-weight:bold;display:inline-block;">
                        Verificar Póliza en Línea (QR)
                      </a>
                    </div>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="background-color:#1a2e5a;padding:16px;text-align:center;">
              <p style="color:#a8c0e0;margin:0;font-size:11px;">
                ${COMPANY_CONFIG.name} · RIF: ${COMPANY_CONFIG.rif} · ${ADMIN_CORPORATE_EMAIL}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
