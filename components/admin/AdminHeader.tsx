'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { navItems } from './AdminSidebar'

export default function AdminHeader({ userEmail }: { userEmail: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Botón menú móvil */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg bg-[#1a2e5a] text-white flex items-center justify-center text-lg flex-shrink-0"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-gray-400 truncate">
              Corporación Venezolana de Garantías R.L.
            </p>
            <h2 className="text-gray-800 font-bold text-sm sm:text-base truncate">
              Sistema de Pólizas RCV
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Sesión activa</p>
            <p className="text-sm text-gray-700 font-medium truncate max-w-[220px]">{userEmail}</p>
          </div>
          <Link
            href="/admin/nueva-poliza"
            className="md:hidden bg-[#c8a619] hover:bg-[#a88810] text-white text-xs font-bold px-3 py-2 rounded-lg"
          >
            + RCV
          </Link>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#1a2e5a] rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
      </header>

      {/* Menú lateral deslizable en móvil */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] bg-[#1a2e5a] text-white flex flex-col h-full z-10 shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#c8a619] rounded-lg flex items-center justify-center text-base">
                  🛡️
                </div>
                <div>
                  <p className="font-bold text-xs leading-tight">CORPORACIÓN VENEZOLANA</p>
                  <p className="text-blue-300 text-[11px]">RIF: J-41285930-7</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-sm"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm font-semibold transition-colors"
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
