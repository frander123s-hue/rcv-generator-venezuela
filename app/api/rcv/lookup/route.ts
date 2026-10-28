import { NextRequest, NextResponse } from 'next/server'
import { lookupByCedulaOrPlate, getNextPolicyNumber } from '@/lib/db/store'

export async function GET(request: NextRequest) {
  const cedula = request.nextUrl.searchParams.get('cedula') || undefined
  const plate = request.nextUrl.searchParams.get('plate') || undefined
  const nextNumber = request.nextUrl.searchParams.get('nextNumber')

  if (nextNumber === '1') {
    const policy_number = await getNextPolicyNumber()
    return NextResponse.json({ policy_number })
  }

  const found = await lookupByCedulaOrPlate({ cedula, plate })
  return NextResponse.json({ found })
}
