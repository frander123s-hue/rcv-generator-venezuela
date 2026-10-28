'use client'

import type { FormData } from '@/app/admin/nueva-poliza/page'

interface StepProps {
  formData: FormData
  onPrev: () => void
  onSubmit: () => void
  isSubmitting: boolean
  error?: string
}

const sym = (c: string) => (c === 'EUR' ? '€' : c === 'USD' ? '$' : 'Bs.')

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0 w-24 sm:w-36">{label}</span>
      <span
        className={`text-xs sm:text-sm text-right break-all sm:break-words ${
          bold ? 'font-bold text-gray-900' : 'text-gray-700'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export default function Step5Preview({ formData, onPrev, onSubmit, isSubmitting, error }: StepProps) {
  const coverages = [
    { label: 'RC - Daños a Cosas', amount: formData.rc_cosas_amount },
    { label: 'RC - Daños a Personas', amount: formData.rc_personas_amount },
    { label: 'Exceso de Garantía', amount: formData.exceso_garantia_amount },
    { label: 'Asistencia Jurídica', amount: formData.asistencia_juridica_amount },
    { label: 'Muerte Conductor', amount: formData.muerte_conductor_amount },
    ...(formData.include_invalidity ? [{ label: 'Invalidez', amount: '' }] : []),
    ...(formData.include_medical ? [{ label: 'Gastos Médicos', amount: '' }] : []),
    ...(formData.include_funeral ? [{ label: 'Gastos Funerarios', amount: '' }] : []),
  ]

  return (
    <div>
      <div className="bg-[#1a2e5a] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-2.5 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
          5
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm sm:text-base">
            Confirmar y Generar Póliza
          </h2>
          <p className="text-blue-300 text-[11px] sm:text-xs">
            Revisa todos los datos antes de generar el PDF
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <span className="text-red-500">❌</span>
            <div>
              <p className="text-red-700 font-semibold text-sm">Error al generar la póliza</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Client */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">👤</span>
              <h3 className="font-semibold text-[#1a2e5a] text-sm">Datos del Cliente</h3>
            </div>
            {formData.photo_preview && (
              <div className="mb-3 flex justify-center">
                <img
                  src={formData.photo_preview}
                  alt="Cliente"
                  className="w-20 h-24 object-cover rounded-lg border-2 border-[#1a2e5a]/20"
                />
              </div>
            )}
            <SummaryRow label="Nombre" value={formData.full_name} bold />
            <SummaryRow label="Cédula/RIF" value={`${formData.cedula_prefix}-${formData.cedula_rif}`} />
            <SummaryRow label="Teléfono" value={formData.phone || 'N/A'} />
            <SummaryRow label="Correo" value={formData.email || 'N/A'} />
            <SummaryRow label="Dirección" value={formData.address || 'N/A'} />
          </div>

          {/* Vehicle */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🚗</span>
              <h3 className="font-semibold text-[#1a2e5a] text-sm">Datos del Vehículo</h3>
            </div>
            <SummaryRow label="Placa" value={formData.plate} bold />
            <SummaryRow label="Marca" value={formData.brand} />
            <SummaryRow label="Modelo" value={formData.model} />
            <SummaryRow label="Año" value={formData.year} />
            <SummaryRow label="Color" value={formData.color} />
            <SummaryRow label="Clase" value={formData.vehicle_class} />
            <SummaryRow label="Tipo" value={formData.vehicle_type} />
            <SummaryRow label="Uso" value={formData.use_type} />
            {formData.vin && <SummaryRow label="VIN" value={formData.vin} />}
            <SummaryRow label="Cap. Personas" value={formData.capacity_persons} />
          </div>

          {/* Policy + Coverages */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📋</span>
                <h3 className="font-semibold text-[#1a2e5a] text-sm">Datos de la Póliza</h3>
              </div>
              <SummaryRow
                label="Vigencia Desde"
                value={new Date(formData.start_date + 'T00:00:00').toLocaleDateString('es-VE')}
              />
              <SummaryRow
                label="Vigencia Hasta"
                value={new Date(formData.end_date + 'T00:00:00').toLocaleDateString('es-VE')}
              />
              <SummaryRow
                label="Prima"
                value={`${sym(formData.currency)}${parseFloat(formData.premium_amount || '0').toFixed(2)} ${formData.currency}`}
                bold
              />
              {formData.advisor && <SummaryRow label="Asesor" value={formData.advisor} />}
              {formData.supervisor && <SummaryRow label="Supervisor" value={formData.supervisor} />}
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🛡️</span>
                <h3 className="font-semibold text-[#1a2e5a] text-sm">Coberturas</h3>
              </div>
              {coverages.map((cov) => (
                <div key={cov.label} className="flex justify-between py-1 text-xs border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{cov.label}</span>
                  <span className="font-semibold text-[#1a2e5a]">
                    {cov.amount ? `${sym(formData.currency)}${parseFloat(cov.amount).toFixed(2)}` : 'INCLUIDA'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-2">
          <span>📧</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm">Al hacer clic en "Generar y Enviar":</p>
            <ul className="text-amber-700 text-sm mt-1 space-y-0.5">
              <li>• Se generará el PDF de la póliza con código QR y foto del cliente</li>
              <li>• Se guardará en la base de datos</li>
              {formData.email && (
                <li>• Se enviará automáticamente a <strong>{formData.email}</strong></li>
              )}
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2.5 pt-4 border-t border-gray-100">
          <button
            onClick={onPrev}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            ← Anterior
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12 h4.853z"></path>
                </svg>
                Generando PDF y enviando correo...
              </>
            ) : (
              '🚀 Generar y Enviar Póliza'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
