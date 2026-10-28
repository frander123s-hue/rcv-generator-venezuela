import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/db/store'

export async function POST() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {}
  }

  const res = NextResponse.json({ success: true })
  res.cookies.delete('rcv_admin_session')
  return res
}
