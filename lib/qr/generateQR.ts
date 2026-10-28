import QRCode from 'qrcode'

export async function generateQRCodeDataURL(url: string): Promise<string> {
  try {
    const qrDataURL = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
    return qrDataURL
  } catch (err) {
    console.error('Error generating QR code:', err)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(url, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
    return buffer
  } catch (err) {
    console.error('Error generating QR code buffer:', err)
    throw new Error('Failed to generate QR code buffer')
  }
}
