'use client'

import { useEffect } from 'react'
import type { FormData } from '@/app/admin/nueva-poliza/page'

interface StepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€ Euros - Formato Original)', symbol: '€' },
  { value: 'USD', label: 'USD ($ Dólares)', symbol: '$' },
  { value: 'BS', label: 'BS (Bolívares)', symbol: 'Bs.' },
]

export default function Step3Policy({ formData, updateFormData, onNext, onPrev }: StepProps) {
  useEffect(() => {
    if (formData.start_date) {
      const start = new Date(formData.start_date + 'T00:00:00')
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + 1)
      updateFormData({ end_date: end.toISOString().split('T')[0] })
    }
  }, [formData.start_date])

  const handleNext = () => {
    if (!formData.premium_amount || !formData.start_date || !formData.end_date) {
      alert('Por favor completa el Pago Total y las fechas de vigencia')
      return
    }
    onNext()
  }

  const selectedCurrency = CURRENCIES.find((c) => c.value === formData.currency)

  return (
    <div>
      <div className="bg-[#1a2e5a] px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
          3
        </div>
        <div>
          <h2 className="text-white font-semibold">Módulo 3: Contrato, Vigencia y Pago Total</h2>
          <p className="text-blue-300 text-xs">
            Configura el N° de Contrato/Recibo, fechas de vigencia y Pago Total (ej. €15.00)
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Contrato / Recibo Nro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contrato / Recibo Nro. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.policy_number}
              onChange={(e) => updateFormData({ policy_number: e.target.value })}
              placeholder="0000043114"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm font-mono font-bold text-gray-900"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vigencia Desde <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => updateFormData({ start_date: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vigencia Hasta <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => updateFormData({ end_date: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              value={formData.currency}
              onChange={(e) => updateFormData({ currency: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm bg-white text-gray-900"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Premium */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PAGO TOTAL <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-700 text-sm font-bold">
                {selectedCurrency?.symbol || '€'}
              </span>
              <input
                type="number"
                value={formData.premium_amount}
                onChange={(e) => updateFormData({ premium_amount: e.target.value })}
                placeholder="15.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900 font-bold"
              />
            </div>
          </div>

          {/* Advisor / Supervisor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asesor</label>
            <input
              type="text"
              value={formData.advisor}
              onChange={(e) => updateFormData({ advisor: e.target.value.toUpperCase() })}
              placeholder="OFICINA PRINCIPAL"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm uppercase text-gray-900"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onPrev}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="bg-[#1a2e5a] hover:bg-[#0f1e3d] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Siguiente: Módulo Garantías →
          </button>
        </div>
      </div>
    </div>
  )
}
