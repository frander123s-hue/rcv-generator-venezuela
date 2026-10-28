import { notFound } from 'next/navigation'
import { getPolicyById } from '@/lib/db/store'
import { COMPANY_CONFIG } from '@/lib/pdf/generateRCV'

export const dynamic = 'force-dynamic'

const COVERAGE_LABELS: Record<string, string> = {
  RC_COSAS: 'Responsabilidad Civil - Daños a Cosas',
  RC_PERSONAS: 'Responsabilidad Civil - Daños a Personas',
  EXCESO_GARANTIA: 'Exceso de Garantía',
  ASISTENCIA_JURIDICA: 'Asistencia Jurídica',
  MUERTE_CONDUCTOR: 'Muerte del Conductor y/o Pasajeros',
  INVALIDEZ_CONDUCTOR: 'Invalidez del Conductor y/o Pasajeros',
  GASTOS_MEDICOS: 'Gastos Médicos',
  GASTOS_FUNERARIOS: 'Gastos Funerarios',
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr.split('T')[0] + 'T00:00:00').toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(amount: number, currency: string) {
  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'Bs.'
  return `${sym}${Number(amount).toFixed(2)}`
}

export default async function RCVPublicPage(context: {
  params: Promise<{ id: string }>
}) {
  const { id } = await context.params
  const policy = await getPolicyById(id)

  if (!policy) {
    notFound()
  }

  const today = new Date().toISOString().split('T')[0]
  const isActive = policy.end_date >= today

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1e3d] to-[#1a3a6e] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-[#1a2e5a] px-6 py-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#c8a619] rounded-full flex items-center justify-center text-2xl">
                🛡️
              </div>
              <div className="text-left">
                <h1 className="text-white font-bold text-base sm:text-lg leading-tight">
                  {COMPANY_CONFIG.name}
                </h1>
                <p className="text-[#c8a619] text-xs sm:text-sm font-semibold">
                  RIF: {COMPANY_CONFIG.rif} · SUNACOOP Exp. 381558
                </p>
              </div>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`px-6 py-3 text-center ${isActive ? 'bg-green-600' : 'bg-red-600'}`}>
            <p className="text-white font-bold text-base">
              {isActive ? '✅ PÓLIZA RCV VIGENTE Y VERIFICADA' : '❌ PÓLIZA RCV VENCIDA'}
            </p>
            <p className="text-white/90 text-xs mt-0.5">
              Contrato / Recibo Nro.: {policy.policy_number}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Datos del Cliente + Foto */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a2e5a] border-b border-gray-200 pb-2 mb-3">
                👤 Datos del Beneficiario / Contratante
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                {policy.clients.photo_url ? (
                  <img
                    src={policy.clients.photo_url}
                    alt={policy.clients.full_name}
                    className="w-28 h-36 object-cover rounded-xl border-2 border-[#1a2e5a]/20 shadow"
                  />
                ) : (
                  <div className="w-24 h-32 bg-gray-100 rounded-xl border border-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold text-center p-2">
                    FOTO ASEGURADO
                  </div>
                )}

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase">Beneficiario</p>
                    <p className="text-sm font-bold text-gray-900">{policy.clients.full_name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase">C.I / RIF</p>
                    <p className="text-sm font-bold text-gray-900">{policy.clients.cedula_rif}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase">Teléfono</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {policy.clients.phone || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase">Correo Electrónico</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {policy.clients.email || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                    <p className="text-xs text-gray-400 uppercase">Dirección</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {policy.clients.address || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del Vehículo */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a2e5a] border-b border-gray-200 pb-2 mb-3">
                🚗 Datos del Vehículo Asegurado
              </h2>
              <div className="text-center mb-4">
                <span className="inline-block bg-[#1a2e5a] text-white font-mono text-2xl font-bold px-6 py-2 rounded-lg tracking-widest shadow">
                  PLACA: {policy.vehicles.plate}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Marca', value: policy.vehicles.brand },
                  { label: 'Modelo', value: policy.vehicles.model },
                  { label: 'Año', value: String(policy.vehicles.year) },
                  { label: 'Color', value: policy.vehicles.color },
                  { label: 'Clase', value: policy.vehicles.class },
                  { label: 'Tipo', value: policy.vehicles.type },
                  { label: 'Uso', value: policy.vehicles.use_type },
                  { label: 'Cap. Personas', value: String(policy.vehicles.capacity_persons || 2) },
                  { label: 'Cap. Carga', value: policy.vehicles.capacity_load || '150 kgs' },
                  { label: 'Serial Carrocería', value: policy.vehicles.vin || 'S/N', full: true },
                ].map(({ label, value, full }) => (
                  <div
                    key={label}
                    className={`bg-gray-50 rounded-lg p-2.5 ${full ? 'col-span-2 sm:col-span-3' : ''}`}
                  >
                    <p className="text-xs text-gray-400 uppercase">{label}</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vigencia */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase">Emisión</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(policy.emission_date)}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-600 uppercase">Vigencia Desde</p>
                <p className="text-sm font-bold text-green-800">{formatDate(policy.start_date)}</p>
              </div>
              <div
                className={`rounded-lg p-3 border ${
                  isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <p className={`text-xs uppercase ${isActive ? 'text-green-600' : 'text-red-500'}`}>
                  Vigencia Hasta
                </p>
                <p className={`text-sm font-bold ${isActive ? 'text-green-800' : 'text-red-700'}`}>
                  {formatDate(policy.end_date)}
                </p>
              </div>
            </div>

            {/* Garantías Contratadas */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a2e5a] border-b border-gray-200 pb-2 mb-3">
                🛡️ Garantías Contratadas
              </h2>
              <div className="space-y-1.5">
                {policy.coverages.map((cov) => (
                  <div
                    key={cov.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700">
                      ✓ {COVERAGE_LABELS[cov.coverage_type] || cov.coverage_type}
                    </span>
                    <span className="font-bold text-[#1a2e5a]">
                      {cov.coverage_amount && cov.coverage_amount > 0
                        ? formatCurrency(cov.coverage_amount, policy.currency)
                        : 'INCLUIDA'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón Descargar PDF Original */}
            <div className="pt-2 text-center">
              <a
                href={`/api/rcv/${policy.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#1a2e5a] hover:bg-[#0f1e3d] text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors text-sm"
              >
                📄 Descargar Póliza y Carnet en PDF
              </a>
            </div>
          </div>

          <div className="bg-[#1a2e5a] px-6 py-4 text-center">
            <p className="text-blue-300 text-xs">
              {COMPANY_CONFIG.name} · RIF: {COMPANY_CONFIG.rif}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
