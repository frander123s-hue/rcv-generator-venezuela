import Link from 'next/link'
import { listAllPolicies } from '@/lib/db/store'
import PoliciesFilterTable from '@/components/admin/PoliciesFilterTable'

export const dynamic = 'force-dynamic'

export default async function PoliciesPage() {
  const rawPolicies = await listAllPolicies()
  const today = new Date().toISOString().split('T')[0]

  const policies = rawPolicies.map((p) => ({
    ...p,
    is_active: p.end_date >= today,
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control y Filtración de Pólizas RCV</h1>
          <p className="text-gray-500 text-sm">{policies.length} pólizas registradas en el sistema</p>
        </div>
        <Link
          href="/admin/nueva-poliza"
          className="bg-[#1a2e5a] hover:bg-[#0f1e3d] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          + Nueva Póliza RCV
        </Link>
      </div>

      <PoliciesFilterTable initialPolicies={policies} />
    </div>
  )
}
