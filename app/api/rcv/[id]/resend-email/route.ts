import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { getPolicyById, updatePolicyFields } from '@/lib/db/store'
import { generateRCVPdf } from '@/lib/pdf/generateRCV'
import { sendPolicyEmail } from '@/lib/email/sendPolicy'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const policy = await getPolicyById(id)

    if (!policy) {
      return NextResponse.json({ error: 'Póliza no encontrada' }, { status: 404 })
    }

    if (!policy.clients.email) {
      return NextResponse.json(
        { error: 'Este cliente no tiene un correo electrónico registrado' },
        { status: 400 }
      )
    }

    const origin = request.nextUrl.origin
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL && !process.env.NEXT_PUBLIC_BASE_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_BASE_URL
        : origin

    const policyForPdf = {
      ...policy,
      clients: {
        ...policy.clients,
        photo_url:
          policy.clients.photo_url?.startsWith('/uploads/')
            ? path.join(process.cwd(), 'public', policy.clients.photo_url)
            : policy.clients.photo_url,
      },
    }

    const pdfBuffer = await generateRCVPdf(policyForPdf, baseUrl)
    const pdfFileName = `RCV-${policy.policy_number}.pdf`

    const mailRes = await sendPolicyEmail({
      to: policy.clients.email,
      clientName: policy.clients.full_name,
      policyNumber: policy.policy_number,
      vehiclePlate: policy.vehicles.plate,
      startDate: policy.start_date,
      endDate: policy.end_date,
      pdfBuffer,
      pdfFileName,
      verifyUrl: `${baseUrl}/rcv/${policy.id}`,
    })

    await updatePolicyFields(policy.id, { email_sent: mailRes.sent })

    return NextResponse.json({
      success: true,
      provider: mailRes.provider,
      delivered_to: mailRes.deliveredTo,
      message: mailRes.note
        ? `Correo enviado (${mailRes.note})`
        : `Correo con PDF enviado exitosamente a ${mailRes.deliveredTo}`,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al enviar el correo' },
      { status: 500 }
    )
  }
}
