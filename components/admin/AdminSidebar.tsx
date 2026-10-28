'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export const navItems = [
  { href: '/admin', label: 'Dashboard', shortLabel: 'Inicio', icon: '📊', exact: true },
  { href: '/admin/nueva-poliza', label: 'Nueva Póliza RCV', shortLabel: 'Nueva RCV', icon: '➕' },
  { href: '/admin/polizas', label: 'Control de Pólizas', shortLabel: 'Pólizas', icon: '📋' },
  { href: '/admin/clientes', label: 'Control de Clientes', shortLabel: 'Clientes', icon: '👥' },
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
    <>
      {/* Barra lateral fija solo en pantallas medianas/grandes (Desktop/Tablet) */}
      <aside className="hidden md:flex md:w-64 bg-[#1a2e5a] text-white flex-col h-screen flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c8a619] rounded-lg flex items-center justify-center text-lg flex-shrink-0">
              🛡️
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs leading-tight truncate">CORPORACIÓN VENEZOLANA</p>
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

      {/* Barra de navegación inferior fija para teléfonos móviles */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1a2e5a] border-t border-white/15 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#c8a619] text-white font-bold shadow'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <span className="text-base leading-none mb-0.5">{item.icon}</span>
              <span className="truncate max-w-[72px]">{item.shortLabel}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
