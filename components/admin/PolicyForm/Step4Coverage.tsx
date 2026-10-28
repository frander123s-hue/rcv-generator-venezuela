'use client'

import type { FormData } from '@/app/admin/nueva-poliza/page'

interface StepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

const currencySymbol = (c: string) => (c === 'EUR' ? '€' : c === 'USD' ? '$' : 'Bs.')

interface CoverageRowProps {
  label: string
  description: string
  amountKey: keyof FormData
  formData: FormData
  updateFormData: (d: Partial<FormData>) => void
  currency: string
}

function CoverageAmountRow({
  label,
  description,
  amountKey,
  formData,
  updateFormData,
  currency,
}: CoverageRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <span className="text-gray-500 text-sm">{currencySymbol(currency)}</span>
        <input
          type="number"
          value={formData[amountKey] as string}
          onChange={(e) => updateFormData({ [amountKey]: e.target.value } as Partial<FormData>)}
          min="0"
          step="0.01"
          className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-right"
        />
      </div>
    </div>
  )
}

interface CheckboxRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}

function CheckboxRow({ label, description, checked, onChange }: CheckboxRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:ring-offset-2 ${
          checked ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export default function Step4Coverage({ formData, updateFormData, onNext, onPrev }: StepProps) {
  return (
    <div>
      <div className="bg-[#1a2e5a] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-2.5 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
          4
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm sm:text-base">Garantías / Coberturas</h2>
          <p className="text-blue-300 text-[11px] sm:text-xs">Definir los montos de cada cobertura</p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monetary Coverages */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#1a2e5a] font-semibold text-sm">💰 Coberturas con Monto</span>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4">
              <CoverageAmountRow
                label="RC - Daños a Cosas"
                description="Responsabilidad Civil por daños a bienes de terceros"
                amountKey="rc_cosas_amount"
                formData={formData}
                updateFormData={updateFormData}
                currency={formData.currency}
              />
              <CoverageAmountRow
                label="RC - Daños a Personas"
                description="Responsabilidad Civil por lesiones a terceros"
                amountKey="rc_personas_amount"
                formData={formData}
                updateFormData={updateFormData}
                currency={formData.currency}
              />
              <CoverageAmountRow
                label="Exceso de Garantía"
                description="Cobertura adicional sobre el límite base"
                amountKey="exceso_garantia_amount"
                formData={formData}
                updateFormData={updateFormData}
                currency={formData.currency}
              />
              <CoverageAmountRow
                label="Asistencia Jurídica"
                description="Defensa legal en caso de siniestro"
                amountKey="asistencia_juridica_amount"
                formData={formData}
                updateFormData={updateFormData}
                currency={formData.currency}
              />
              <CoverageAmountRow
                label="Muerte del Conductor y/o Pasajeros"
                description="Indemnización por fallecimiento"
                amountKey="muerte_conductor_amount"
                formData={formData}
                updateFormData={updateFormData}
                currency={formData.currency}
              />
            </div>
          </div>

          {/* Included Coverages */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#1a2e5a] font-semibold text-sm">✅ Coberturas Incluidas</span>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4">
              <CheckboxRow
                label="Invalidez del Conductor y/o Pasajeros"
                description="Cobertura por incapacidad permanente"
                checked={formData.include_invalidity}
                onChange={(v) => updateFormData({ include_invalidity: v })}
              />
              <CheckboxRow
                label="Gastos Médicos"
                description="Atención médica post-accidente"
                checked={formData.include_medical}
                onChange={(v) => updateFormData({ include_medical: v })}
              />
              <CheckboxRow
                label="Gastos Funerarios"
                description="Cobertura de gastos fúnebres"
                checked={formData.include_funeral}
                onChange={(v) => updateFormData({ include_funeral: v })}
              />
            </div>

            {/* Summary */}
            <div className="mt-4 bg-[#1a2e5a]/5 border border-[#1a2e5a]/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#1a2e5a] mb-2">Resumen de Coberturas</p>
              <div className="space-y-1 text-xs text-gray-600">
                {[
                  { label: 'RC Cosas', val: formData.rc_cosas_amount },
                  { label: 'RC Personas', val: formData.rc_personas_amount },
                  { label: 'Exceso Garantía', val: formData.exceso_garantia_amount },
                  { label: 'Asistencia Jurídica', val: formData.asistencia_juridica_amount },
                  { label: 'Muerte Conductor', val: formData.muerte_conductor_amount },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between">
                    <span>{label}</span>
                    <span className="font-semibold">{currencySymbol(formData.currency)}{parseFloat(val || '0').toFixed(2)}</span>
                  </div>
                ))}
                {formData.include_invalidity && <div className="flex justify-between"><span>Invalidez</span><span className="text-green-600 font-semibold">INCLUIDA</span></div>}
                {formData.include_medical && <div className="flex justify-between"><span>Gastos Médicos</span><span className="text-green-600 font-semibold">INCLUIDA</span></div>}
                {formData.include_funeral && <div className="flex justify-between"><span>Gastos Funerarios</span><span className="text-green-600 font-semibold">INCLUIDA</span></div>}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2.5 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onPrev}
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            ← Anterior
          </button>
          <button
            onClick={onNext}
            className="w-full sm:w-auto bg-[#1a2e5a] hover:bg-[#0f1e3d] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Siguiente: Confirmar →
          </button>
        </div>
      </div>
    </div>
  )
}
