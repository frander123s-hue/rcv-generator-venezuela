import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/db/store'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  let userEmail = cookieStore.get('rcv_admin_session')?.value || ''

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email) {
        userEmail = user.email
      }
    } catch {}
  }

  if (!userEmail) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar userEmail={userEmail} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
