import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateRCVPdf } from '@/lib/pdf/generateRCV'
import { sendPolicyEmail } from '@/lib/email/sendPolicy'
import {
  isSupabaseConfigured,
  getNextPolicyNumber,
  saveFullRCVRecord,
  updatePolicyFields,
} from '@/lib/db/store'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const full_name = ((formData.get('full_name') as string) || '').trim().toUpperCase()
    const cedula_rif_raw = ((formData.get('cedula_rif') as string) || '').trim()
    const cedula_prefix = ((formData.get('cedula_prefix') as string) || 'V').trim()
    const cedula_rif = cedula_rif_raw.includes('-')
      ? cedula_rif_raw.toUpperCase()
      : `${cedula_prefix}-${cedula_rif_raw}`
    const phone = ((formData.get('phone') as string) || '').trim()
    const email = ((formData.get('email') as string) || '').trim()
    const address = ((formData.get('address') as string) || '').trim()
    const photo_file = formData.get('photo_file') as File | null

    const plate = ((formData.get('plate') as string) || '').trim().toUpperCase()
    const brand = ((formData.get('brand') as string) || '').trim().toUpperCase()
    const model = ((formData.get('model') as string) || '').trim().toUpperCase()
    const year = parseInt((formData.get('year') as string) || '2024', 10)
    const color = ((formData.get('color') as string) || '').trim().toUpperCase()
    const vehicle_class = ((formData.get('vehicle_class') as string) || 'MOTO').trim().toUpperCase()
    const vehicle_type = ((formData.get('vehicle_type') as string) || 'PASEO').trim().toUpperCase()
    const use_type = ((formData.get('use_type') as string) || 'PARTICULAR').trim().toUpperCase()
    const vin = ((formData.get('vin') as string) || '').trim().toUpperCase()
    const capacity_persons = parseInt((formData.get('capacity_persons') as string) || '2', 10)
    const capacity_load = ((formData.get('capacity_load') as string) || '150 kgs').trim()

    const custom_policy_number = ((formData.get('policy_number') as string) || '').trim()
    const start_date = (formData.get('start_date') as string) || new Date().toISOString().split('T')[0]
    const end_date =
      (formData.get('end_date') as string) ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const premium_amount = parseFloat((formData.get('premium_amount') as string) || '15')
    const currency = ((formData.get('currency') as string) || 'EUR').trim()
    const advisor = ((formData.get('advisor') as string) || 'OFICINA PRINCIPAL').trim().toUpperCase()
    const supervisor = ((formData.get('supervisor') as string) || 'GERENCIA').trim().toUpperCase()

    const rc_cosas_amount = parseFloat((formData.get('rc_cosas_amount') as string) || '2000')
    const rc_personas_amount = parseFloat((formData.get('rc_personas_amount') as string) || '2505')
    const exceso_garantia_amount = parseFloat((formData.get('exceso_garantia_amount') as string) || '250')
    const asistencia_juridica_amount = parseFloat((formData.get('asistencia_juridica_amount') as string) || '250')
    const muerte_conductor_amount = parseFloat((formData.get('muerte_conductor_amount') as string) || '500')
    const include_invalidity = formData.get('include_invalidity') !== 'false'
    const include_medical = formData.get('include_medical') !== 'false'
    const include_funeral = formData.get('include_funeral') !== 'false'

    const origin = request.nextUrl.origin
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL && !process.env.NEXT_PUBLIC_BASE_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_BASE_URL
        : origin

    // 1. Handle client photo in memory + Supabase Storage (or Data URL fallback, no filesystem writes)
    const photo_preview_raw = ((formData.get('photo_preview') as string) || '').trim()
    let photo_url: string | undefined
    if (photo_file && photo_file.size > 0) {
      const photoBytes = await photo_file.arrayBuffer()
      const photoBuffer = Buffer.from(photoBytes)
      const mimeType = photo_file.type.includes('png') ? 'image/png' : 'image/jpeg'
      const ext = mimeType === 'image/png' ? 'png' : 'jpg'
      const safeName = `photo-${Date.now()}.${ext}`

      // Default in-memory data URL so it always renders in PDF and QR page
      photo_url = `data:${mimeType};base64,${photoBuffer.toString('base64')}`

      if (isSupabaseConfigured()) {
        try {
          const supabase = await createAdminClient()
          const { data: photoData, error: photoError } = await supabase.storage
            .from('client-photos')
            .upload(safeName, photoBuffer, {
              contentType: mimeType,
              upsert: true,
            })
          if (!photoError && photoData) {
            const { data: urlData } = supabase.storage
              .from('client-photos')
              .getPublicUrl(photoData.path)
            if (urlData?.publicUrl) {
              photo_url = urlData.publicUrl
            }
          }
        } catch {}
      }
    } else if (photo_preview_raw.startsWith('data:image/') || photo_preview_raw.startsWith('http')) {
      photo_url = photo_preview_raw
    }

    // 2. Policy number (auto-generate unique if duplicate)
    let policy_number = custom_policy_number || (await getNextPolicyNumber())
    const receipt_number = policy_number

    // 3. Save full record to Supabase
    const fullPolicy = await saveFullRCVRecord({
      client: {
        full_name,
        cedula_rif,
        phone,
        email,
        address,
        photo_url,
      },
      vehicle: {
        plate,
        brand,
        model,
        year,
        color,
        class: vehicle_class,
        type: vehicle_type,
        use_type,
        vin,
        capacity_persons,
        capacity_load,
      },
      policy: {
        policy_number,
        receipt_number,
        start_date,
        end_date,
        emission_date: new Date().toISOString().split('T')[0],
        premium_amount,
        currency,
        payment_type: 'CONTADO',
        advisor,
        supervisor,
        email_sent: false,
        status: 'active',
      },
      coverages: [
        { coverage_type: 'RC_COSAS', coverage_amount: rc_cosas_amount, included: true },
        { coverage_type: 'RC_PERSONAS', coverage_amount: rc_personas_amount, included: true },
        { coverage_type: 'EXCESO_GARANTIA', coverage_amount: exceso_garantia_amount, included: true },
        { coverage_type: 'ASISTENCIA_JURIDICA', coverage_amount: asistencia_juridica_amount, included: true },
        { coverage_type: 'MUERTE_CONDUCTOR', coverage_amount: muerte_conductor_amount, included: true },
        ...(include_invalidity
          ? [{ coverage_type: 'INVALIDEZ_CONDUCTOR', coverage_amount: 0, included: true }]
          : []),
        ...(include_medical
          ? [{ coverage_type: 'GASTOS_MEDICOS', coverage_amount: 0, included: true }]
          : []),
        ...(include_funeral
          ? [{ coverage_type: 'GASTOS_FUNERARIOS', coverage_amount: 0, included: true }]
          : []),
      ],
    })

    // 4. Generate PDF Buffer completely in memory (no disk write to /var/task)
    const pdfBuffer = await generateRCVPdf(fullPolicy, baseUrl)
    const pdfFileName = `RCV-${fullPolicy.policy_number}.pdf`
    let pdf_url = `/api/rcv/${fullPolicy.id}/pdf`

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createAdminClient()
        const { data: pdfUpload, error: pdfUploadError } = await supabase.storage
          .from('rcv-pdfs')
          .upload(pdfFileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          })
        if (!pdfUploadError && pdfUpload) {
          const { data: pdfUrlData } = supabase.storage
            .from('rcv-pdfs')
            .getPublicUrl(pdfUpload.path)
          if (pdfUrlData?.publicUrl) {
            pdf_url = pdfUrlData.publicUrl
          }
        }
      } catch {}
    }

    const qr_url = `${baseUrl}/rcv/${fullPolicy.id}`

    // 5. Send email with PDF attached automatically
    let emailSent = false
    let emailErrorMsg = ''
    if (email) {
      try {
        const mailRes = await sendPolicyEmail({
          to: email,
          clientName: full_name,
          policyNumber: fullPolicy.policy_number,
          vehiclePlate: plate,
          startDate: start_date,
          endDate: end_date,
          pdfBuffer,
          pdfFileName,
          verifyUrl: qr_url,
        })
        emailSent = mailRes.sent
        if (mailRes.note) {
          emailErrorMsg = mailRes.note
        }
      } catch (emailErr: any) {
        console.warn('Email send warning:', emailErr?.message || emailErr)
        emailErrorMsg = emailErr?.message || 'Nota en envío de correo'
      }
    }

    await updatePolicyFields(fullPolicy.id, {
      pdf_url: `/api/rcv/${fullPolicy.id}/pdf`,
      qr_url,
      email_sent: emailSent,
    })

    return NextResponse.json({
      success: true,
      policy_id: fullPolicy.id,
      policy_number: fullPolicy.policy_number,
      receipt_number: fullPolicy.receipt_number,
      pdf_url: `/api/rcv/${fullPolicy.id}/pdf`,
      qr_url,
      email_sent: emailSent,
      email_warning: emailErrorMsg || undefined,
    })
  } catch (error: any) {
    console.error('RCV creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al generar RCV' },
      { status: 500 }
    )
  }
}
