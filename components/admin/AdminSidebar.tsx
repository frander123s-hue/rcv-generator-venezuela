'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/nueva-poliza', label: 'Nueva Póliza RCV', icon: '➕' },
  { href: '/admin/polizas', label: 'Control de Pólizas', icon: '📋' },
  { href: '/admin/clientes', label: 'Control de Clientes', icon: '👥' },
]

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-[#1a2e5a] text-white flex flex-col h-screen">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c8a619] rounded-lg flex items-center justify-center text-lg">
            🛡️
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">CORPORACIÓN VENEZOLANA</p>
            <p className="text-blue-300 text-[11px]">RIF: J-41285930-7</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-white/10 rounded-lg p-3 mb-3">
          <p className="text-xs text-blue-300">Administrador</p>
          <p className="text-white text-xs font-medium truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded-lg text-sm transition-colors"
        >
          <span>🚪</span> Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
