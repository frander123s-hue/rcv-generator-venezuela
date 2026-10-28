import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { getPolicyById } from '@/lib/db/store'
import { generateRCVPdf } from '@/lib/pdf/generateRCV'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const policy = await getPolicyById(id)

    if (!policy) {
      return NextResponse.json({ error: 'Póliza no encontrada' }, { status: 404 })
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
    const download = request.nextUrl.searchParams.get('download') === '1'

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="RCV-${policy.policy_number}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al generar PDF' },
      { status: 500 }
    )
  }
}
