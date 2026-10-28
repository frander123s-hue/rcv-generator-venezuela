import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/db/store'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Ingresa tu correo y contraseña de administrador' },
        { status: 400 }
      )
    }

    const configuredAdminEmail = process.env.ADMIN_EMAIL
    const configuredAdminPassword = process.env.ADMIN_PASSWORD || 'admin123456'

    // Validate against ADMIN_EMAIL if explicitly set
    if (
      configuredAdminEmail &&
      !configuredAdminEmail.includes('your_admin') &&
      email.toLowerCase().trim() !== configuredAdminEmail.toLowerCase().trim()
    ) {
      return NextResponse.json(
        { error: 'Este correo no está autorizado como administrador.' },
        { status: 403 }
      )
    }

    // Try Supabase Auth when configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (!error && data.user) {
          const res = NextResponse.json({
            success: true,
            email: data.user.email,
          })
          res.cookies.set('rcv_admin_session', data.user.email || email, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          })
          return res
        }
      } catch {}
    }

    // Also allow login via ADMIN_PASSWORD env var
    if (password === configuredAdminPassword) {
      const res = NextResponse.json({
        success: true,
        email: email.trim(),
      })
      res.cookies.set('rcv_admin_session', email.trim(), {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
      return res
    }

    return NextResponse.json(
      { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' },
      { status: 401 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error en inicio de sesión' },
      { status: 500 }
    )
  }
}
