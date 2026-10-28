import Link from 'next/link'
import { listAllPolicies, listAllClients, isSupabaseConfigured } from '@/lib/db/store'
import QuickResendEmailButton from '@/components/admin/QuickResendEmailButton'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [policies, clients] = await Promise.all([listAllPolicies(), listAllClients()])
  const today = new Date().toISOString().split('T')[0]

  const totalPolicies = policies.length
  const activePolicies = policies.filter((p) => p.end_date >= today).length
  const expiredPolicies = policies.filter((p) => p.end_date < today).length
  const totalClients = clients.length
  const emailsSent = policies.filter((p) => p.email_sent).length

  const statCards = [
    {
      title: 'Total Pólizas',
      value: totalPolicies,
      icon: '📋',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Vigentes',
      value: activePolicies,
      icon: '✅',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      iconBg: 'bg-green-100',
    },
    {
      title: 'Vencidas',
      value: expiredPolicies,
      icon: '⏰',
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
      iconBg: 'bg-red-100',
    },
    {
      title: 'Clientes',
      value: totalClients,
      icon: '👥',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
      iconBg: 'bg-purple-100',
    },
    {
      title: 'Correos Enviados',
      value: emailsSent,
      icon: '📧',
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-700',
      iconBg: 'bg-amber-100',
    },
  ]

  const recentPolicies = policies.slice(0, 8)
  const supabaseActive = isSupabaseConfigured()

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
            Dashboard — Corporación Venezolana de Garantías R.L.
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Control central de clientes, pólizas RCV emitidas, códigos QR y envíos de correo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              supabaseActive
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {supabaseActive ? '🟢 Conectado a Supabase Cloud' : '🟡 Modo Local Activo'}
          </span>
          <a
            href="/api/cron/keep-alive"
            target="_blank"
            rel="noreferrer"
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
            title="Tarea programada activa para mantener Supabase y Vercel encendidos 24/7"
          >
            ⚡ Keep-Alive 24/7 Activo
          </a>
        </div>
      </div>

      {/* Stats Grid: 2 columnas en móvil, 5 en escritorio */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={stat.title}
            className={`rounded-xl border p-3 sm:p-4 ${stat.color} ${
              idx === 4 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div
                className={`${stat.iconBg} w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0`}
              >
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                  {stat.title}
                </p>
                <p className={`text-xl sm:text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-[#1a2e5a] to-[#1a3a6e] rounded-xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">
              Emitir Nueva Póliza RCV con QR y Foto
            </h3>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Genera el PDF exacto con Póliza + 2 Carnets Recortables + Condicionado de 8 Cláusulas y envíalo al correo del cliente automáticamente.
            </p>
          </div>
          <Link
            href="/admin/nueva-poliza"
            className="bg-[#c8a619] hover:bg-[#a88810] text-white font-semibold px-5 py-3 rounded-lg transition-colors text-center text-sm sm:text-base whitespace-nowrap"
          >
            + Crear Nueva Póliza RCV
          </Link>
        </div>
      </div>

      {/* Recent Policies */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
            Últimas Pólizas Creadas
          </h2>
          <Link href="/admin/polizas" className="text-xs sm:text-sm text-blue-600 hover:underline font-medium">
            Ver todas →
          </Link>
        </div>

        {/* Vista de Tarjetas para Móviles (< md) */}
        <div className="md:hidden divide-y divide-gray-100">
          {recentPolicies.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              No hay pólizas aún. ¡Toca &quot;+ Crear Nueva Póliza RCV&quot; para generar la primera!
            </div>
          ) : (
            recentPolicies.map((policy) => (
              <div key={policy.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded border border-blue-200">
                    N° {policy.policy_number}
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    {policy.currency === 'EUR' ? '€' : policy.currency === 'USD' ? '$' : 'Bs.'}
                    {Number(policy.premium_amount).toFixed(2)}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-snug">
                    {policy.clients?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {policy.clients?.cedula_rif}{' '}
                    {policy.clients?.email ? `· ${policy.clients.email}` : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <div>
                    <span className="font-mono font-bold text-gray-900">
                      {policy.vehicles?.plate}
                    </span>{' '}
                    · {policy.vehicles?.brand} {policy.vehicles?.model}
                  </div>
                  <div className="text-right text-[11px]">
                    Vence: <span className="font-semibold">{policy.end_date}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`/api/rcv/${policy.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-semibold"
                  >
                    📄 Ver PDF
                  </a>
                  <Link
                    href={`/rcv/${policy.id}`}
                    target="_blank"
                    className="flex-1 text-center text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-semibold"
                  >
                    📱 Ver QR
                  </Link>
                  <QuickResendEmailButton
                    policyId={policy.id}
                    clientEmail={policy.clients?.email}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tabla para Escritorio (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Contrato Nro.</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Beneficiario</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Vehículo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Vigencia</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Pago Total</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentPolicies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No hay pólizas aún. ¡Haz clic en &quot;+ Crear Nueva Póliza RCV&quot; para generar la primera!
                  </td>
                </tr>
              ) : (
                recentPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-bold">
                      {policy.policy_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{policy.clients?.full_name}</div>
                      <div className="text-gray-400 text-xs">{policy.clients?.cedula_rif}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-gray-700">
                        {policy.vehicles?.plate}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {policy.vehicles?.brand} {policy.vehicles?.model}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{policy.start_date}</div>
                      <div>→ {policy.end_date}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {policy.currency === 'EUR' ? '€' : policy.currency === 'USD' ? '$' : 'Bs.'}
                      {Number(policy.premium_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={`/api/rcv/${policy.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1 rounded font-semibold"
                        >
                          📄 PDF
                        </a>
                        <Link
                          href={`/rcv/${policy.id}`}
                          target="_blank"
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded font-semibold"
                        >
                          📱 QR
                        </Link>
                        <QuickResendEmailButton
                          policyId={policy.id}
                          clientEmail={policy.clients?.email}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
