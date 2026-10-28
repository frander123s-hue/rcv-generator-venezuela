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
      title: 'Pólizas Vigentes',
      value: activePolicies,
      icon: '✅',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      iconBg: 'bg-green-100',
    },
    {
      title: 'Pólizas Vencidas',
      value: expiredPolicies,
      icon: '⏰',
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
      iconBg: 'bg-red-100',
    },
    {
      title: 'Total Clientes',
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard — Corporación Venezolana de Garantías R.L.
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Control central de clientes, pólizas RCV emitidas, códigos QR y envíos de correo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              supabaseActive
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {supabaseActive
              ? '🟢 Conectado a Supabase Cloud'
              : '🟡 Modo Local Activo (Listo para tus API Keys de Supabase)'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className={`rounded-xl border p-4 ${stat.color}`}>
            <div className="flex items-center gap-3">
              <div
                className={`${stat.iconBg} w-10 h-10 rounded-lg flex items-center justify-center text-xl`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-[#1a2e5a] to-[#1a3a6e] rounded-xl p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Emitir Nueva Póliza RCV con QR y Foto</h3>
            <p className="text-blue-200 text-sm mt-1">
              Genera el PDF exacto con Póliza + 2 Carnets Recortables + Condicionado de 8 Cláusulas y envíalo al correo del cliente automáticamente.
            </p>
          </div>
          <Link
            href="/admin/nueva-poliza"
            className="bg-[#c8a619] hover:bg-[#a88810] text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            + Crear Nueva Póliza RCV
          </Link>
        </div>
      </div>

      {/* Recent Policies Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Últimas Pólizas Creadas</h2>
          <Link href="/admin/polizas" className="text-sm text-blue-600 hover:underline">
            Ver y filtrar todas →
          </Link>
        </div>
        <div className="overflow-x-auto">
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
