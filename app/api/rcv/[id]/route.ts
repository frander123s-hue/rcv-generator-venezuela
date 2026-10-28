import { NextRequest, NextResponse } from 'next/server'
import { getPolicyById } from '@/lib/db/store'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const policy = await getPolicyById(id)

  if (!policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  return NextResponse.json(policy)
}
