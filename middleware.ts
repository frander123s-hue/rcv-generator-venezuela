import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const localAdminCookie = request.cookies.get('rcv_admin_session')?.value
  let isAuthenticated = Boolean(localAdminCookie)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your_supabase') &&
    supabaseUrl.startsWith('http')
  ) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      })

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const adminEmail = process.env.ADMIN_EMAIL
        if (
          !adminEmail ||
          adminEmail.includes('your_admin') ||
          user.email?.toLowerCase() === adminEmail.toLowerCase()
        ) {
          isAuthenticated = true
        }
      }
    } catch {}
  }

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginRoute = request.nextUrl.pathname === '/login'

  if (isAdminRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
