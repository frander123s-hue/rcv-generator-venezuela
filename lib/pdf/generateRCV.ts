import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, degrees } from 'pdf-lib'
import { generateQRCodeBuffer } from '../qr/generateQR'
import type { PolicyWithDetails } from '../types'
import fs from 'fs'
import path from 'path'

// ============================================================
// DATOS CORPORATIVOS REALISTAS (Reemplazan al RIF y nombre original)
// ============================================================
export const COMPANY_CONFIG = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'CORPORACION VENEZOLANA DE GARANTIAS R.L',
  shortBrandTop: 'CORPORACION',
  shortBrandMid: 'VENEZOLANA',
  shortBrandBot: 'DE GARANTIAS',
  rif: process.env.NEXT_PUBLIC_COMPANY_RIF || 'J-41285930-7',
  registroLine1:
    'Registrada en la Sucursal del Registro Público del Estado Miranda Bajo el Número 42, Folio 188, del Tomo 31 del Protocolo de Transcripción del 2014',
  registroLine2:
    'Inscrita y Autorizada para realizar actividades de Garantías y Seguros por la SUNACOOP bajo el Nro de Expediente 381558',
}

const BLACK = rgb(0, 0, 0)
const WHITE = rgb(1, 1, 1)
const DARK_GRAY = rgb(0.22, 0.22, 0.22)
const MID_GRAY = rgb(0.45, 0.45, 0.45)
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93)
const BORDER_GRAY = rgb(0.35, 0.35, 0.35)
const GOLD_BROWN = rgb(0.58, 0.38, 0.12)
const SEA_BLUE = rgb(0.16, 0.42, 0.65)
const STAMP_BLUE = rgb(0.12, 0.24, 0.48)

function formatDateDash(dateStr: string): string {
  if (!dateStr) return ''
  const clean = dateStr.split('T')[0]
  const [year, month, day] = clean.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}-${month}-${year}`
}

function formatDateSlash(dateStr: string): string {
  if (!dateStr) return ''
  const clean = dateStr.split('T')[0]
  const [year, month, day] = clean.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}/${month}/${year}`
}

function formatEuro(amount: number, currency: string = 'EUR'): string {
  const sym = currency === 'USD' ? '$' : currency === 'BS' ? 'Bs.' : '€'
  const formatted = amount.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${sym}${formatted}`
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)
    if (width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function drawCorporateLogo(
  page: PDFPage,
  x: number,
  y: number,
  fontBold: PDFFont,
  scale: number = 1
) {
  // Globe icon (matching original style)
  const radius = 12 * scale
  const cx = x + 22 * scale
  const cy = y + 18 * scale

  page.drawCircle({
    x: cx,
    y: cy,
    size: radius,
    color: GOLD_BROWN,
    borderColor: DARK_GRAY,
    borderWidth: 0.8 * scale,
  })
  page.drawCircle({
    x: cx + 2 * scale,
    y: cy + 1 * scale,
    size: radius * 0.55,
    color: SEA_BLUE,
  })
  // Grid lines on globe
  page.drawLine({
    start: { x: cx - radius, y: cy },
    end: { x: cx + radius, y: cy },
    thickness: 0.4 * scale,
    color: WHITE,
  })
  page.drawLine({
    start: { x: cx, y: cy - radius },
    end: { x: cx, y: cy + radius },
    thickness: 0.4 * scale,
    color: WHITE,
  })

  // Text: CORPORACION / VENEZOLANA / DE GARANTIAS
  page.drawText('C', {
    x: x,
    y: y + 14 * scale,
    size: 11 * scale,
    font: fontBold,
    color: MID_GRAY,
  })
  page.drawText('RPORACION', {
    x: x + 36 * scale,
    y: y + 14 * scale,
    size: 10 * scale,
    font: fontBold,
    color: MID_GRAY,
  })
  page.drawText(COMPANY_CONFIG.shortBrandMid, {
    x: x + 18 * scale,
    y: y + 3 * scale,
    size: 12.5 * scale,
    font: fontBold,
    color: DARK_GRAY,
  })
  page.drawText(COMPANY_CONFIG.shortBrandBot, {
    x: x + 20 * scale,
    y: y - 5 * scale,
    size: 7.5 * scale,
    font: fontBold,
    color: MID_GRAY,
  })
}

async function loadSignatureImage(pdfDoc: PDFDocument) {
  try {
    const sigPath = path.join(process.cwd(), 'public', 'assets', 'firma-autorizada.jpg')
    if (fs.existsSync(sigPath)) {
      const sigBytes = fs.readFileSync(sigPath)
      return await pdfDoc.embedJpg(sigBytes)
    }
  } catch (err) {
    console.warn('Could not embed signature image:', err)
  }
  return null
}

async function loadClientPhoto(pdfDoc: PDFDocument, photoUrl?: string) {
  if (!photoUrl) return null
  try {
    if (photoUrl.startsWith('data:image/')) {
      const base64Data = photoUrl.split(',')[1]
      const bytes = Buffer.from(base64Data, 'base64')
      if (photoUrl.includes('image/png')) {
        return await pdfDoc.embedPng(bytes)
      }
      return await pdfDoc.embedJpg(bytes)
    }
    if (photoUrl.startsWith('http')) {
      const res = await fetch(photoUrl)
      if (!res.ok) return null
      const arrayBuf = await res.arrayBuffer()
      const bytes = new Uint8Array(arrayBuf)
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('png') || photoUrl.toLowerCase().endsWith('.png')) {
        return await pdfDoc.embedPng(bytes)
      }
      return await pdfDoc.embedJpg(bytes)
    }
    if (fs.existsSync(photoUrl)) {
      const bytes = fs.readFileSync(photoUrl)
      if (photoUrl.toLowerCase().endsWith('.png')) {
        return await pdfDoc.embedPng(bytes)
      }
      return await pdfDoc.embedJpg(bytes)
    }
  } catch (err) {
    console.warn('Could not embed client photo:', err)
  }
  return null
}

export async function generateRCVPdf(
  policy: PolicyWithDetails,
  baseUrl: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const pageWidth = 595.28 // A4 width
  const pageHeight = 841.89 // A4 height

  const signatureImg = await loadSignatureImage(pdfDoc)
  const clientPhotoImg = await loadClientPhoto(pdfDoc, policy.clients?.photo_url)

  const qrVerifyUrl = `${baseUrl.replace(/\/$/, '')}/rcv/${policy.id}`
  let qrImg = null
  try {
    const qrBuffer = await generateQRCodeBuffer(qrVerifyUrl)
    qrImg = await pdfDoc.embedPng(qrBuffer)
  } catch (err) {
    console.warn('QR embed error:', err)
  }

  // ============================================================
  // PÁGINA 1: PÓLIZA PRINCIPAL (SUPERIOR) + 2 CARNETS RCV (INFERIOR)
  // ============================================================
  const page1 = pdfDoc.addPage([pageWidth, pageHeight])
  const margin = 24
  const contentWidth = pageWidth - margin * 2

  // --- ENCABEZADO SUPERIOR ---
  let curY = pageHeight - 36
  drawCorporateLogo(page1, margin, curY - 12, fontBold, 0.95)

  page1.drawText(`RIF:${COMPANY_CONFIG.rif}`, {
    x: margin + 145,
    y: curY + 8,
    size: 8.5,
    font: fontBold,
    color: BLACK,
  })
  page1.drawText(COMPANY_CONFIG.name, {
    x: margin + 225,
    y: curY + 8,
    size: 8.5,
    font: fontBold,
    color: BLACK,
  })

  page1.drawText('SEGURO DE RESPONSABILIDAD CIVIL DE VEHICULOS', {
    x: margin + 145,
    y: curY - 2,
    size: 8,
    font: fontBold,
    color: BLACK,
  })
  page1.drawText(`RECIBO Nro.: ${policy.receipt_number || policy.policy_number}`, {
    x: pageWidth - margin - 135,
    y: curY - 2,
    size: 8,
    font: fontBold,
    color: BLACK,
  })

  page1.drawText(COMPANY_CONFIG.registroLine1, {
    x: margin + 145,
    y: curY - 11,
    size: 5.7,
    font: fontRegular,
    color: DARK_GRAY,
  })
  page1.drawText(COMPANY_CONFIG.registroLine2, {
    x: margin + 145,
    y: curY - 18,
    size: 5.7,
    font: fontRegular,
    color: DARK_GRAY,
  })

  // --- TÍTULO CENTRAL ---
  curY -= 32
  const mainTitle = 'PÓLIZA DE RESPONSABILIDAD CIVIL DE VEHÍCULOS'
  const mainTitleW = fontBold.widthOfTextAtSize(mainTitle, 9.5)
  page1.drawText(mainTitle, {
    x: (pageWidth - mainTitleW) / 2,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: BLACK,
  })

  curY -= 10
  const subTitle = `***DE ${policy.payment_type || 'CONTADO'}***`
  const subTitleW = fontBold.widthOfTextAtSize(subTitle, 8)
  page1.drawText(subTitle, {
    x: (pageWidth - subTitleW) / 2,
    y: curY,
    size: 8,
    font: fontBold,
    color: BLACK,
  })

  // --- FILA CONTRATO Y VIGENCIA ---
  curY -= 16
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: contentWidth,
    height: 14,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
    color: LIGHT_GRAY,
  })
  page1.drawText(`Contrato Nro.:  ${policy.policy_number}`, {
    x: margin + 6,
    y: curY + 4,
    size: 7.5,
    font: fontBold,
  })
  page1.drawText(`Vigencia Desde:  ${formatDateDash(policy.start_date)}`, {
    x: margin + 145,
    y: curY + 4,
    size: 7.5,
    font: fontBold,
  })
  page1.drawText(`Vigencia Hasta:  ${formatDateDash(policy.end_date)}`, {
    x: margin + 285,
    y: curY + 4,
    size: 7.5,
    font: fontBold,
  })
  page1.drawText(`Fecha Emisión:  ${formatDateDash(policy.emission_date)}`, {
    x: margin + 420,
    y: curY + 4,
    size: 7.5,
    font: fontBold,
  })

  // --- TABLA DATOS DEL CLIENTE + FOTO + QR ---
  const rightPanelWidth = 128 // Space on the right for Client Photo + QR
  const leftTableWidth = contentWidth - rightPanelWidth

  curY -= 13
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: leftTableWidth,
    height: 13,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
    color: LIGHT_GRAY,
  })
  page1.drawText('DATOS DEL CLIENTE', {
    x: margin + 6,
    y: curY + 3.5,
    size: 7.5,
    font: fontBold,
  })
  const advisorSupervisorText = `ASESOR: ${(policy.advisor || 'OFICINA').substring(0, 16)}   SUPERVISOR: ${(policy.supervisor || 'GERENCIA').substring(0, 16)}`
  page1.drawText(advisorSupervisorText, {
    x: margin + 170,
    y: curY + 3.5,
    size: 6.5,
    font: fontBold,
  })

  // Client Row 1: Beneficiario | C.I/RIF | Correo
  curY -= 15
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: leftTableWidth,
    height: 15,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
  })
  page1.drawText(`Beneficiario: ${(policy.clients?.full_name || '').toUpperCase()}`, {
    x: margin + 6,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`C.I/RIF: ${policy.clients?.cedula_rif || ''}`, {
    x: margin + 220,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`CORREO: ${(policy.clients?.email || '').substring(0, 26)}`, {
    x: margin + 300,
    y: curY + 4.5,
    size: 6.5,
    font: fontRegular,
  })

  // Client Row 2: Dirección + Teléfono
  curY -= 15
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: leftTableWidth,
    height: 15,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
  })
  const addrText = `Dirección: ${(policy.clients?.address || 'CARACAS, VENEZUELA').toUpperCase()}  |  Tel: ${policy.clients?.phone || 'N/A'}`
  page1.drawText(addrText.substring(0, 82), {
    x: margin + 6,
    y: curY + 4.5,
    size: 7,
    font: fontRegular,
  })

  // --- DATOS DEL VEHÍCULO ---
  curY -= 13
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: leftTableWidth,
    height: 13,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
    color: LIGHT_GRAY,
  })
  page1.drawText('DATOS DEL VEHICULO', {
    x: margin + 6,
    y: curY + 3.5,
    size: 7.5,
    font: fontBold,
  })

  const v = policy.vehicles
  // Vehicle Row 1: Marca | Modelo | Serial Carrocería
  curY -= 15
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: leftTableWidth,
    height: 15,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
  })
  page1.drawText(`Marca: ${(v?.brand || '').toUpperCase()}`, {
    x: margin + 6,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`Modelo: ${(v?.model || '').toUpperCase()}`, {
    x: margin + 125,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`Serial CARROCERÍA: ${(v?.vin || 'S/N').toUpperCase()}`, {
    x: margin + 250,
    y: curY + 4.5,
    size: 7,
    font: fontBold,
  })

  // Vehicle Row 2: Clase | Placa | Color | Año | Capacidad Personas
  curY -= 15
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: leftTableWidth,
    height: 15,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
  })
  page1.drawText(`Clase: ${(v?.class || 'MOTO').toUpperCase()}`, {
    x: margin + 6,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`Placa: ${(v?.plate || '').toUpperCase()}`, {
    x: margin + 95,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`Color: ${(v?.color || '').toUpperCase()}`, {
    x: margin + 180,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`Año: ${v?.year || ''}`, {
    x: margin + 265,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`Capacidad Personas: ${v?.capacity_persons || 2}`, {
    x: margin + 320,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })

  // Vehicle Row 3: Tipo | Uso | Capacidad Carga
  curY -= 15
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: leftTableWidth,
    height: 15,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
  })
  page1.drawText(`Tipo: ${(v?.type || 'PASEO').toUpperCase()}`, {
    x: margin + 6,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`Uso: ${(v?.use_type || 'PARTICULAR').toUpperCase()}`, {
    x: margin + 125,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })
  page1.drawText(`Capacidad Carga: ${v?.capacity_load || '150 kgs'}`, {
    x: margin + 265,
    y: curY + 4.5,
    size: 7.2,
    font: fontBold,
  })

  // --- PANEL LATERAL DERECHO: FOTO DEL CLIENTE + CÓDIGO QR ---
  const sideBoxX = margin + leftTableWidth
  const sideBoxY = curY
  const sideBoxH = 101 // Covers Client + Vehicle rows exactly
  page1.drawRectangle({
    x: sideBoxX,
    y: sideBoxY,
    width: rightPanelWidth,
    height: sideBoxH,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
  })

  // Foto del cliente (Izquierda del panel lateral)
  const photoW = 56
  const photoH = 72
  const photoX = sideBoxX + 6
  const photoY = sideBoxY + 18
  page1.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoW,
    height: photoH,
    borderColor: BORDER_GRAY,
    borderWidth: 0.6,
    color: LIGHT_GRAY,
  })
  if (clientPhotoImg) {
    page1.drawImage(clientPhotoImg, {
      x: photoX + 1,
      y: photoY + 1,
      width: photoW - 2,
      height: photoH - 2,
    })
  } else {
    page1.drawText('FOTO', { x: photoX + 16, y: photoY + 40, size: 7, font: fontBold, color: MID_GRAY })
    page1.drawText('ASEGURADO', { x: photoX + 6, y: photoY + 30, size: 6.5, font: fontBold, color: MID_GRAY })
  }
  page1.drawText('ASEGURADO', {
    x: photoX + 7,
    y: sideBoxY + 6,
    size: 6,
    font: fontBold,
    color: DARK_GRAY,
  })

  // QR Code (Derecha del panel lateral)
  const qrSize = 58
  const qrX = sideBoxX + 66
  const qrY = sideBoxY + 25
  if (qrImg) {
    page1.drawImage(qrImg, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    })
  }
  page1.drawText('VERIFICAR QR', {
    x: qrX + 6,
    y: sideBoxY + 14,
    size: 6,
    font: fontBold,
    color: DARK_GRAY,
  })
  page1.drawText('EN LÍNEA', {
    x: qrX + 14,
    y: sideBoxY + 6,
    size: 5.5,
    font: fontRegular,
    color: MID_GRAY,
  })

  // --- GARANTÍAS CONTRATADAS ---
  curY -= 14
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: contentWidth,
    height: 14,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
    color: LIGHT_GRAY,
  })
  page1.drawText('GARANTÍAS CONTRATADAS', {
    x: margin + 210,
    y: curY + 4,
    size: 8,
    font: fontBold,
  })

  curY -= 12
  page1.drawText('Beneficio', { x: margin + 8, y: curY + 2, size: 7.5, font: fontBold })
  page1.drawText('Cobertura', { x: pageWidth - margin - 80, y: curY + 2, size: 7.5, font: fontBold })

  const covMap: Record<string, number> = {}
  for (const c of policy.coverages || []) {
    covMap[c.coverage_type] = Number(c.coverage_amount || 0)
  }

  const mainCoverages = [
    ['RESPONSABILIDAD CIVIL - Daños A COSAS', covMap['RC_COSAS'] ?? 2000],
    ['RESPONSABILIDAD CIVIL - Daños A PERSONAS', covMap['RC_PERSONAS'] ?? 2505],
    ['EXCESO DE GARANTIA', covMap['EXCESO_GARANTIA'] ?? 250],
    ['ASISTENCIA JURIDICA', covMap['ASISTENCIA_JURIDICA'] ?? 250],
  ] as const

  for (const [label, amount] of mainCoverages) {
    curY -= 11
    page1.drawText(label, { x: margin + 8, y: curY + 2, size: 7.2, font: fontRegular })
    page1.drawText(formatEuro(amount, policy.currency), {
      x: pageWidth - margin - 80,
      y: curY + 2,
      size: 7.2,
      font: fontBold,
    })
  }

  // Bloque agrupado de €500,00 (Muerte, Invalidez, Gastos Médicos, Gastos Funerarios)
  const muerteAmount = covMap['MUERTE_CONDUCTOR'] ?? 500
  const extraLines = [
    'MUERTE DEL CONDUCTOR Y/O PASAJEROS',
    'INVALIDEZ DEL CONDUCTOR Y/O PASAJEROS',
    'GASTOS MEDICOS',
    'GASTOS FUNERARIOS',
  ]
  extraLines.forEach((line, idx) => {
    curY -= 10
    page1.drawText(line, { x: margin + 8, y: curY + 2, size: 7, font: fontRegular })
    if (idx === 1) {
      page1.drawText(formatEuro(muerteAmount, policy.currency), {
        x: pageWidth - margin - 80,
        y: curY + 2,
        size: 7.2,
        font: fontBold,
      })
    }
  })

  // --- BARRA DE ACEPTACIÓN Y PAGO TOTAL EUR ---
  curY -= 22
  page1.drawRectangle({
    x: margin,
    y: curY,
    width: contentWidth - 95,
    height: 20,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
  })
  page1.drawText(
    'EL PRESENTE CONTRATO DE GARANTIA PROCEDE DE UN CONDICIONADO Y CLAUSULAS QUE EL',
    { x: margin + 5, y: curY + 11, size: 6.2, font: fontBold }
  )
  page1.drawText(
    'CONTRATANTE DECLARA Y ACEPTA LAS CONDICIONES ESTABLECIDAS POR LA EMPRESA',
    { x: margin + 5, y: curY + 3, size: 6.2, font: fontBold }
  )

  page1.drawRectangle({
    x: margin + contentWidth - 95,
    y: curY,
    width: 95,
    height: 20,
    borderColor: BORDER_GRAY,
    borderWidth: 0.7,
    color: LIGHT_GRAY,
  })
  page1.drawText(`PAGO TOTAL ${policy.currency || 'EUR'}`, {
    x: margin + contentWidth - 88,
    y: curY + 11,
    size: 6.5,
    font: fontBold,
  })
  page1.drawText(formatEuro(Number(policy.premium_amount || 15), policy.currency), {
    x: margin + contentWidth - 70,
    y: curY + 2.5,
    size: 8.5,
    font: fontBold,
  })

  // --- FIRMA AUTORIZADA CENTRAL (DEBAJO DEL CUADRO PRINCIPAL) ---
  curY -= 50
  if (signatureImg) {
    page1.drawImage(signatureImg, {
      x: pageWidth / 2 - 55,
      y: curY + 8,
      width: 110,
      height: 38,
    })
  }
  page1.drawLine({
    start: { x: pageWidth / 2 - 70, y: curY + 8 },
    end: { x: pageWidth / 2 + 70, y: curY + 8 },
    thickness: 0.7,
    color: BLACK,
  })
  page1.drawText('FIRMA AUTORIZADA', {
    x: pageWidth / 2 - 38,
    y: curY - 1,
    size: 7,
    font: fontBold,
  })

  // Línea punteada de corte
  curY -= 12
  for (let dashX = margin; dashX < pageWidth - margin; dashX += 8) {
    page1.drawLine({
      start: { x: dashX, y: curY },
      end: { x: dashX + 4, y: curY },
      thickness: 0.5,
      color: MID_GRAY,
    })
  }

  // ============================================================
  // MITAD INFERIOR PÁGINA 1: DOS CARNETS / CERTIFICADOS RCV
  // ============================================================
  const cardTopY = curY - 10
  const cardHeight = 225
  const cardY = cardTopY - cardHeight
  const cardWidth = (contentWidth - 14) / 2

  for (let idx = 0; idx < 2; idx++) {
    const cX = idx === 0 ? margin : margin + cardWidth + 14

    // Borde exterior del carnet
    page1.drawRectangle({
      x: cX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      borderColor: BORDER_GRAY,
      borderWidth: 0.9,
    })

    // Logo pequeño en esquina superior izquierda del carnet
    drawCorporateLogo(page1, cX + 6, cardTopY - 26, fontBold, 0.65)

    // RIF y Nombre de la Corporación a la derecha del logo
    page1.drawText(`RIF:${COMPANY_CONFIG.rif}`, {
      x: cX + 108,
      y: cardTopY - 14,
      size: 6.5,
      font: fontBold,
    })
    page1.drawText(COMPANY_CONFIG.name, {
      x: cX + 82,
      y: cardTopY - 23,
      size: 5.8,
      font: fontBold,
    })
    page1.drawText('SEGURO RCV', {
      x: cX + 115,
      y: cardTopY - 32,
      size: 7,
      font: fontBold,
    })

    // Fechas y Contrato No
    let rowY = cardTopY - 46
    page1.drawText(`F.EMISION: ${formatDateSlash(policy.emission_date)}`, {
      x: cX + 8,
      y: rowY,
      size: 6.8,
      font: fontBold,
    })
    rowY -= 10
    page1.drawText(`F. VENCIMIENTO: ${formatDateSlash(policy.end_date)}`, {
      x: cX + 8,
      y: rowY,
      size: 6.8,
      font: fontBold,
    })
    page1.drawText(`CONTRATO No: .${policy.policy_number}`, {
      x: cX + 130,
      y: rowY,
      size: 6.8,
      font: fontBold,
    })

    // Contratante y C.I/RIF
    rowY -= 12
    page1.drawText(
      `CONTRATANTE:  ${(policy.clients?.full_name || '').toUpperCase().substring(0, 28)}`,
      {
        x: cX + 8,
        y: rowY,
        size: 6.8,
        font: fontBold,
      }
    )
    rowY -= 10
    page1.drawText(`C.I/RIF: ${policy.clients?.cedula_rif || ''}`, {
      x: cX + 8,
      y: rowY,
      size: 6.8,
      font: fontBold,
    })

    // Mini foto del cliente + Mini QR en el carnet (esquina derecha)
    if (clientPhotoImg) {
      page1.drawImage(clientPhotoImg, {
        x: cX + cardWidth - 78,
        y: rowY - 48,
        width: 34,
        height: 44,
      })
      page1.drawRectangle({
        x: cX + cardWidth - 78,
        y: rowY - 48,
        width: 34,
        height: 44,
        borderColor: BORDER_GRAY,
        borderWidth: 0.4,
      })
    }
    if (qrImg) {
      page1.drawImage(qrImg, {
        x: cX + cardWidth - 40,
        y: rowY - 46,
        width: 34,
        height: 34,
      })
    }

    // Datos del vehículo en 2 columnas dentro del carnet
    rowY -= 14
    const colA = cX + 8
    const colB = cX + 102

    page1.drawText(`CLASE: ${(v?.class || 'MOTO').toUpperCase()}`, {
      x: colA,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })
    page1.drawText(`USO: ${(v?.use_type || 'PARTICULAR').toUpperCase()}`, {
      x: colB,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })

    rowY -= 10
    page1.drawText(`MARCA: ${(v?.brand || '').toUpperCase()}`, {
      x: colA,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })
    page1.drawText(`COLOR: ${(v?.color || '').toUpperCase()}`, {
      x: colB,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })

    rowY -= 10
    page1.drawText(`MODELO: ${(v?.model || '').toUpperCase().substring(0, 14)}`, {
      x: colA,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })
    page1.drawText(`AÑO: ${v?.year || ''}`, {
      x: colB,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })

    rowY -= 10
    page1.drawText(`PLACA: ${(v?.plate || '').toUpperCase()}`, {
      x: colA,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })
    page1.drawText(`TIPO: ${(v?.type || 'PASEO').toUpperCase()}`, {
      x: colB,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })

    rowY -= 11
    page1.drawText(`SERIAL CARROCERIA: ${(v?.vin || 'S/N').toUpperCase()}`, {
      x: colA,
      y: rowY,
      size: 6.5,
      font: fontBold,
    })

    // Zona de firmas del carnet
    const sigLineY = cardY + 22
    if (idx === 0) {
      // Carnet izquierdo: FIRMA CONTRATANTE y FIRMA AUTORIZADA
      page1.drawLine({
        start: { x: cX + 12, y: sigLineY },
        end: { x: cX + 115, y: sigLineY },
        thickness: 0.6,
        color: BLACK,
      })
      page1.drawText('FIRMA CONTRATANTE', {
        x: cX + 24,
        y: sigLineY - 8,
        size: 6,
        font: fontBold,
      })

      if (signatureImg) {
        page1.drawImage(signatureImg, {
          x: cX + 145,
          y: sigLineY + 1,
          width: 85,
          height: 28,
        })
      }
      page1.drawLine({
        start: { x: cX + 135, y: sigLineY },
        end: { x: cX + cardWidth - 12, y: sigLineY },
        thickness: 0.6,
        color: BLACK,
      })
      page1.drawText('FIRMA AUTORIZADA', {
        x: cX + 155,
        y: sigLineY - 8,
        size: 6,
        font: fontBold,
      })
    } else {
      // Carnet derecho: FIRMA CONTRATANTE y FIRMA AUTORIZADA + nota de validez
      page1.drawLine({
        start: { x: cX + 12, y: sigLineY },
        end: { x: cX + 115, y: sigLineY },
        thickness: 0.6,
        color: BLACK,
      })
      page1.drawText('FIRMA CONTRATANTE', {
        x: cX + 24,
        y: sigLineY - 8,
        size: 6,
        font: fontBold,
      })

      if (signatureImg) {
        page1.drawImage(signatureImg, {
          x: cX + 145,
          y: sigLineY + 1,
          width: 85,
          height: 28,
        })
      }
      page1.drawLine({
        start: { x: cX + 135, y: sigLineY },
        end: { x: cX + cardWidth - 12, y: sigLineY },
        thickness: 0.6,
        color: BLACK,
      })
      page1.drawText('FIRMA AUTORIZADA', {
        x: cX + 155,
        y: sigLineY - 8,
        size: 6,
        font: fontBold,
      })
    }

    page1.drawText(
      'Este contrato para tener validez debe ser firmado y sellado por la persona autorizada',
      {
        x: cX + 12,
        y: cardY + 5,
        size: 5.5,
        font: fontOblique,
        color: DARK_GRAY,
      }
    )
  }

  // ============================================================
  // PÁGINA 2: CONDICIONADO DE RESPONSABILIDAD CIVIL DE VEHÍCULO
  // ============================================================
  const page2 = pdfDoc.addPage([pageWidth, pageHeight])
  let p2Y = pageHeight - 40

  // Logo superior izquierdo
  drawCorporateLogo(page2, margin, p2Y - 12, fontBold, 0.9)

  // RIF y Nombre a la derecha
  const rifHeader = `RIF: ${COMPANY_CONFIG.rif}`
  page2.drawText(rifHeader, {
    x: pageWidth - margin - fontBold.widthOfTextAtSize(rifHeader, 9.5),
    y: p2Y + 4,
    size: 9.5,
    font: fontBold,
  })
  page2.drawText(COMPANY_CONFIG.name, {
    x: pageWidth - margin - fontBold.widthOfTextAtSize(COMPANY_CONFIG.name, 9.5),
    y: p2Y - 8,
    size: 9.5,
    font: fontBold,
  })

  // Título Condicionado
  p2Y -= 42
  const condTitle = 'CONDICIONADO DE RESPONSABILIDAD CIVIL DE VEHICULO'
  page2.drawText(condTitle, {
    x: (pageWidth - fontBold.widthOfTextAtSize(condTitle, 10)) / 2,
    y: p2Y,
    size: 10,
    font: fontBold,
  })

  p2Y -= 22
  const clauses = [
    `PRIMERA: ENTRE LA ${COMPANY_CONFIG.name}, QUIEN EN LO ADELANTE SE DENOMINARA LA CORPORACION POR UNA PARTE Y POR LA OTRA EL CONTRATANTE EL CUAL APARECE IDENTIFICADO EN EL CUADRO DE EJECUCION, SE HA CELEBRADO EL PRESENTE CONTRATO ADMINISTRADO DE RESPONSABILIDAD CIVIL DE VEHICULO, EN EL CUAL LA CORPORACION SE HACE RESPONSABLE DE CANCELAR O REPARAR DIRECTAMENTE AL TERCERO O VICTIMA DE ACCIDENTE DE TRANSITO OCURRIDO DENTRO DEL TERRITORIO NACIONAL, PERO LIMITADO CON LAS GARANTIAS ESPECIFICADAS EN DICHO CONTRATO.`,
    `SEGUNDA: AL OCURRIR ACCIDENTE DE TRANSITO EN EL QUE RESULTEN DAÑOS A TERCEROS, EL CONTRATANTE Y EL AFECTADO DEBEN CUMPLIR CON LAS SIGUIENTES OBLIGACIONES:`,
    `   A) NOTIFICAR POR ESCRITO A LA CORPORACION LO SUCEDIDO, Y ENTREGAR LAS ACTUACIONES DE TRANSITO EN UN PLAZO NO MAYOR DE 5 DIAS HABILES.`,
    `   B) DE NO INTERVENIR LAS AUTORIDADES DE TRANSITO Y LOS DAÑOS SEAN SOLO MATERIALES, LOS INVOLUCRADOS DEBEN INFORMAR A LAS AUTORIDADES CON UNA DENUNCIA DE TRANSITO, EN ESTE CASO LA CORPORACION ESTABLECE UN MONTO MAXIMO A CANCELAR DE 10€ POR PIEZA DAÑADA (LATONERIA Y PINTURA) O POR DAÑOS GENERALES UN MAXIMO EQUIVALENTE A 150€ VIGENTES PARA LA FECHA DE EMISION DEL PRESENTE CONTRATO Y EL CONTRATANTE QUEDARA SOMETIDO A UNA INSPECCION PARA DETERMINAR LA RESPONSABILIDAD DEL MISMO.`,
    `TERCERA: LA DURACION DEL CONTRATO ES DE UN (1) AÑO CONTADO A PARTIR DEL MOMENTO QUE SE HA RECIBIDO EL MONTO DEL PAGO CORRESPONDIENTE A LA CUOTA ESTABLECIDA, PERO LA CORPORACION TIENE LA POTESTAD DE ANULAR EL MISMO, SIN LIBERARSE DE NINGUNA RESPONSABILIDAD DE DAÑOS A TERCEROS EN EL CASO QUE EXISTA.`,
    `CUARTA: NO PROCEDERA LA RECLAMACION DE TERCEROS EN LOS SIGUIENTES CASOS:`,
    `   A) CUANDO EL CONTRATANTE NO SE ENCUENTRE SOLVENTE CON EL PAGO TOTAL DEL CONTRATO EN CASO DE SER CONTADO O DE LA CUOTA CORRESPONDIENTE EN CASOS DE SER FINANCIADO.`,
    `   B) CUANDO EL CONTRATANTE VENDA O ENAJENE EL VEHICULO DEBE NOTIFICAR A LA CORPORACION POR ESCRITO Y LUEGO LA CORPORACION NOTIFICARA POR ESCRITO LA SUSTITUCION CONTRAYENTE.`,
    `   C) CUANDO EL CONDUCTOR DEL VEHICULO SE ENCUENTRE EN EL MOMENTO DEL ACCIDENTE BAJO LA INFLUENCIA DE ALCOHOL, DROGA, O EXCESO DE VELOCIDAD.`,
    `   D) CUANDO EL USO DEL VEHICULO SEA DISTINTO AL ESPECIFICADO EN EL CONTRATO O ESTE PRACTICANDO COMPETENCIA DE VELOCIDAD, ESTABILIDAD O ENSAYOS DE EFICIENCIA.`,
    `   E) CUANDO EL VEHICULO NO SE ENCUENTRE EN PERFECTAS CONDICIONES DE SEGURIDAD, FUNCIONAMIENTO E HIGIENE (DE ACUERDO EN LO ESTABLECIDO EN EL ART. 20 DEL REGLAMENTO DE LA LEY DE TRANSITO TERRESTRE Y AL ART. 49.)`,
    `   F) CUANDO EL AUTORIZADO CONDUCTOR NO SE ENCUENTRE LEGALMENTE AUTORIZADO POR EL SETRA, PARA CONDUCIR, O SUS CONDICIONES FISICAS NO ESTEN CERTIFICADAS COMO APTAS POR EL DEPARTAMENTO NACIONAL DE MEDICINA VIAL DE ACUERDO A LO ESTABLECIDO EN EL ART. 20 DEL REGLAMENTO DE LA LEY DE TRANSITO TERRESTRE Y EL ART. 49, LITERAL 5 DE LA LEY DE TRANSITO Y TRANSPORTE TERRESTRE.`,
    `QUINTA: LA CORPORACION SE COMPROMETE A INDEMNIZAR A LOS OCUPANTES POR LOS MONTOS Y GARANTIAS ESPECIFICADAS EN EL CUADRO DE EJECUCION DE R.C.V SI EL MOMENTO DEL ACCIDENTE DE TRANSITO EL NUMERO DE OCUPANTES SOBREPASA EL NUMERO DE PUESTOS INDICADOS EN EL CONTRATO, LOS MONTOS AMPARADOS PARA CADA PUESTO SERAN DISMINUIDOS PROPORCIONALMENTE ENTRE EL NUMERO DE LESIONADOS O MUERTOS.`,
    `SEXTA: LOS OCUPANTES DEL VEHICULO DEBERAN SUMINISTRAR A LA CORPORACION CUALQUIER INFORMACION QUE LA MISMA SOLICITE, IGUALMENTE ESTARAN OBLIGADOS SUS HEREDEROS, LOS CUALES TENDRAN QUE REALIZAR OBLIGATORIAMENTE UNA DECLARACION SUCESORIAL PARA OBTENER LA INDEMNIZACION CORRESPONDIENTE.`,
    `SEPTIMA: RECARGO DE PRIMAS: EN EL MOMENTO DE LA RENOVACION DE ESTE CONTRATO, SI EL ASEGURADO HUBIESE PRESENTADO SINIESTROS INDEMNIZADOS EN EL PERIODO DE VIGENCIA INMEDIATAMENTE ANTERIOR, TENDRA UN RECARGO EQUIVALENTE AL DIEZ POR CIENTO (10%) DE LA PRIMA POR CADA SINIESTRO SEGÚN LA TARIFA VIGENTE, HASTA UN MAXIMO DE DOS (2) SINIESTROS, DE TRES (3) A CINCO (5) SINIESTROS, LA PRIMA SE INCREMENTARA EN UN CINCUENTA POR CIENTO (50%) MANTENIENDOSE EL LIMITE DE COBERTURA.`,
    `OCTAVA: NOTIFICACION DE CAMBIOS: EL CONTRATANTE DEBERA NOTIFICAR A LA CORPORACION EL CAMBIO DE PROPIEDAD DEL VEHICULO ASEGURADO, DENTRO DE LOS QUINCE (15) DIAS HABILES SIGUIENTES A LA FECHA CIERTA DEL TRASPASO DEL VEHICULO, A FIN DE QUE LA CORPORACION PROCEDA A LA EMISION DEL ANEXO CON EL CAMBIO DE CONTRATANTE Y/O BENEFICIARIO.`,
  ]

  for (const paragraph of clauses) {
    const isSubItem = paragraph.startsWith('   ')
    const xPos = isSubItem ? margin + 14 : margin
    const lines = wrapText(paragraph.trim(), fontRegular, 7.6, contentWidth - (isSubItem ? 14 : 0))
    for (const line of lines) {
      page2.drawText(line, {
        x: xPos,
        y: p2Y,
        size: 7.6,
        font: fontRegular,
        color: BLACK,
      })
      p2Y -= 10.5
    }
    p2Y -= 5
  }

  // --- PIE DE PÁGINA 2: FIRMA CONTRATANTE + FIRMA Y SELLO DE LA CORPORACIÓN ---
  const footerSigY = 95

  // Firma Contratante (Izquierda)
  page2.drawLine({
    start: { x: margin, y: footerSigY },
    end: { x: margin + 210, y: footerSigY },
    thickness: 0.8,
    color: BLACK,
  })
  page2.drawText('FIRMA CONTRATANTE', {
    x: margin + 52,
    y: footerSigY - 12,
    size: 8,
    font: fontBold,
  })

  // Firma Autorizada + Sello Húmedo (Derecha)
  const rightSigX = pageWidth - margin - 230
  if (signatureImg) {
    page2.drawImage(signatureImg, {
      x: rightSigX + 20,
      y: footerSigY + 2,
      width: 125,
      height: 44,
    })
  }

  // Sello corporativo inclinado al lado de la firma
  page2.drawText(COMPANY_CONFIG.shortBrandTop, {
    x: rightSigX + 150,
    y: footerSigY + 18,
    size: 7.5,
    font: fontBold,
    color: STAMP_BLUE,
    rotate: degrees(16),
  })
  page2.drawText(COMPANY_CONFIG.shortBrandMid, {
    x: rightSigX + 152,
    y: footerSigY + 9,
    size: 9.5,
    font: fontBold,
    color: STAMP_BLUE,
    rotate: degrees(16),
  })
  page2.drawText(`RIF: ${COMPANY_CONFIG.rif}`, {
    x: rightSigX + 156,
    y: footerSigY + 1,
    size: 6.5,
    font: fontBold,
    color: STAMP_BLUE,
    rotate: degrees(16),
  })

  page2.drawLine({
    start: { x: rightSigX, y: footerSigY },
    end: { x: pageWidth - margin, y: footerSigY },
    thickness: 0.8,
    color: BLACK,
  })
  page2.drawText(COMPANY_CONFIG.name, {
    x: rightSigX + 15,
    y: footerSigY - 11,
    size: 7.5,
    font: fontBold,
  })
  page2.drawText(`RIF: ${COMPANY_CONFIG.rif}`, {
    x: rightSigX + 75,
    y: footerSigY - 21,
    size: 7.5,
    font: fontBold,
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
