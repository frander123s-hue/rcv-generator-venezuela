import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/db/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        supabase: 'local_fallback',
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - startTime,
      })
    }

    const supabase = await createAdminClient()

    const [policiesRes, clientsRes, vehiclesRes] = await Promise.all([
      supabase.from('policies').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }),
    ])

    if (policiesRes.error) {
      throw new Error(policiesRes.error.message)
    }

    return NextResponse.json({
      ok: true,
      supabase: 'active',
      message: 'Supabase database & Vercel instance keep-alive ping successful',
      counts: {
        policies: policiesRes.count ?? 0,
        clients: clientsRes.count ?? 0,
        vehicles: vehiclesRes.count ?? 0,
      },
      latency_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Keep-alive error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
