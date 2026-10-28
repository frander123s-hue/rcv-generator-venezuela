import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
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

    // 1. Handle client photo upload (Supabase Storage + local public folder)
    let photo_url: string | undefined
    if (photo_file && photo_file.size > 0) {
      const photoBytes = await photo_file.arrayBuffer()
      const photoBuffer = Buffer.from(photoBytes)
      const ext = photo_file.type.includes('png') ? 'png' : 'jpg'
      const safeName = `photo-${Date.now()}.${ext}`

      // Save locally in public/uploads/photos so PDF generator can always read it fast
      const localPhotoDir = path.join(process.cwd(), 'public', 'uploads', 'photos')
      if (!fs.existsSync(localPhotoDir)) {
        fs.mkdirSync(localPhotoDir, { recursive: true })
      }
      fs.writeFileSync(path.join(localPhotoDir, safeName), photoBuffer)
      photo_url = `/uploads/photos/${safeName}`

      // Also upload to Supabase Storage if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = await createAdminClient()
          const { data: photoData, error: photoError } = await supabase.storage
            .from('client-photos')
            .upload(safeName, photoBuffer, {
              contentType: photo_file.type,
              upsert: true,
            })
          if (!photoError && photoData) {
            const { data: urlData } = supabase.storage
              .from('client-photos')
              .getPublicUrl(photoData.path)
            photo_url = urlData.publicUrl
          }
        } catch {}
      }
    }

    // 2. Policy number
    const policy_number = custom_policy_number || (await getNextPolicyNumber())
    const receipt_number = policy_number

    // 3. Save full record
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

    // Resolve local photo path for PDF generation if relative
    const policyForPdf = {
      ...fullPolicy,
      clients: {
        ...fullPolicy.clients,
        photo_url:
          fullPolicy.clients.photo_url?.startsWith('/uploads/')
            ? path.join(process.cwd(), 'public', fullPolicy.clients.photo_url)
            : fullPolicy.clients.photo_url,
      },
    }

    // 4. Generate PDF Buffer
    const pdfBuffer = await generateRCVPdf(policyForPdf, baseUrl)
    const pdfFileName = `RCV-${policy_number}.pdf`

    // Save PDF locally in public/uploads/pdfs and serve via /api/rcv/[id]/pdf
    const localPdfDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs')
    if (!fs.existsSync(localPdfDir)) {
      fs.mkdirSync(localPdfDir, { recursive: true })
    }
    fs.writeFileSync(path.join(localPdfDir, pdfFileName), pdfBuffer)
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
          pdf_url = pdfUrlData.publicUrl
        }
      } catch {}
    }

    const qr_url = `${baseUrl}/rcv/${fullPolicy.id}`

    // 5. Send email with PDF attached automatically
    let emailSent = false
    let emailErrorMsg = ''
    if (email) {
      try {
        await sendPolicyEmail({
          to: email,
          clientName: full_name,
          policyNumber: policy_number,
          vehiclePlate: plate,
          startDate: start_date,
          endDate: end_date,
          pdfBuffer,
          pdfFileName,
          verifyUrl: qr_url,
        })
        emailSent = true
      } catch (emailErr: any) {
        console.warn('Email send warning:', emailErr?.message || emailErr)
        emailErrorMsg = emailErr?.message || 'Error al enviar correo (verifica RESEND_API_KEY)'
      }
    }

    await updatePolicyFields(fullPolicy.id, {
      pdf_url,
      qr_url,
      email_sent: emailSent,
    })

    return NextResponse.json({
      success: true,
      policy_id: fullPolicy.id,
      policy_number,
      receipt_number,
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
