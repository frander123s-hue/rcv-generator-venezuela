import Link from 'next/link'
import { listAllClients } from '@/lib/db/store'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const clients = await listAllClients()
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Clientes Asegurados</h1>
          <p className="text-gray-500 text-sm">{clients.length} clientes registrados</p>
        </div>
        <Link
          href="/admin/nueva-poliza"
          className="bg-[#1a2e5a] hover:bg-[#0f1e3d] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          + Nueva Póliza RCV
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a2e5a] text-white">
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Beneficiario</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Vehículos</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Pólizas</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No hay clientes registrados aún.
                  </td>
                </tr>
              ) : (
                clients.map((client: any) => {
                  const activePolicies = (client.policies || []).filter(
                    (p: any) => p.end_date >= today
                  ).length

                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {client.photo_url ? (
                            <img
                              src={client.photo_url}
                              alt={client.full_name}
                              className="w-10 h-12 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#1a2e5a] rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {client.full_name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{client.full_name}</p>
                            <p className="text-gray-500 text-xs">{client.cedula_rif}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div>{client.email || '—'}</div>
                        <div>{client.phone || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(client.vehicles || []).map((v: any) => (
                            <span
                              key={v.id}
                              className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono text-xs font-bold"
                            >
                              {v.plate}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                          {activePolicies} vigentes
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString('es-VE') : ''}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
