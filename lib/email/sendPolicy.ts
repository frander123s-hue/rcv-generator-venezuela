import { Resend } from 'resend'
import { COMPANY_CONFIG } from '../pdf/generateRCV'

interface SendPolicyEmailParams {
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
}: SendPolicyEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.includes('your_resend')) {
    throw new Error('RESEND_API_KEY no está configurada aún en .env.local')
  }

  const resend = new Resend(apiKey)
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    'Corporacion Venezolana de Garantias <onboarding@resend.dev>'

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: `Póliza RCV N° ${policyNumber} - ${COMPANY_CONFIG.name}`,
    html: generateEmailHTML({
      clientName,
      policyNumber,
      vehiclePlate,
      startDate,
      endDate,
      verifyUrl,
    }),
    attachments: [
      {
        filename: pdfFileName,
        content: pdfBuffer,
      },
    ],
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return data
}

function generateEmailHTML({
  clientName,
  policyNumber,
  vehiclePlate,
  startDate,
  endDate,
  verifyUrl,
}: {
  clientName: string
  policyNumber: string
  vehiclePlate: string
  startDate: string
  endDate: string
  verifyUrl?: string
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
                ${COMPANY_CONFIG.name} · RIF: ${COMPANY_CONFIG.rif}
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
