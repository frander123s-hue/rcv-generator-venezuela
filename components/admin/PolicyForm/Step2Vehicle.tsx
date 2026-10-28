'use client'

import { useState } from 'react'
import type { FormData } from '@/app/admin/nueva-poliza/page'

interface StepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

const BRANDS = [
  'BERA', 'EMPIRE KEEWAY', 'TORO', 'MD HAOJUE', 'SUZUKI', 'YAMAHA', 'HONDA', 'KAWASAKI',
  'TOYOTA', 'FORD', 'CHEVROLET', 'HYUNDAI', 'KIA', 'NISSAN', 'MITSUBISHI', 'RENAULT',
  'FIAT', 'JEEP', 'DODGE', 'VOLKSWAGEN', 'MAZDA', 'CHERY', 'JAC', 'ENCAVA', 'MACK', 'OTRA'
]

const VEHICLE_CLASSES = [
  { value: 'MOTO', persons: '2', load: '150 kgs', defaultType: 'PASEO' },
  { value: 'AUTOMOVIL', persons: '5', load: '450 kgs', defaultType: 'SEDAN' },
  { value: 'CAMIONETA', persons: '5', load: '1000 kgs', defaultType: 'SPORT WAGON' },
  { value: 'RUSTICO', persons: '5', load: '850 kgs', defaultType: 'TODO TERRENO' },
  { value: 'CAMION', persons: '3', load: '3500 kgs', defaultType: 'CARGA' },
  { value: 'MINIBUS', persons: '24', load: '2500 kgs', defaultType: 'COLECTIVO' },
]

const VEHICLE_TYPES = [
  'PASEO', 'SEDAN', 'COUPE', 'HATCHBACK', 'SPORT WAGON', 'PICK-UP',
  'PANEL', 'FURGON', 'CHUTO', 'PLATAFORMA', 'COLECTIVO', 'TURISMO'
]

const USE_TYPES = ['PARTICULAR', 'CARGA', 'TRANSPORTE PUBLICO', 'COMERCIAL', 'OFICIAL']

export default function Step2Vehicle({ formData, updateFormData, onNext, onPrev }: StepProps) {
  const [lookupMsg, setLookupMsg] = useState('')

  const handleClassFilterChange = (newClass: string) => {
    const preset = VEHICLE_CLASSES.find((c) => c.value === newClass)
    if (preset) {
      updateFormData({
        vehicle_class: newClass,
        capacity_persons: preset.persons,
        capacity_load: preset.load,
        vehicle_type: preset.defaultType,
      })
    } else {
      updateFormData({ vehicle_class: newClass })
    }
  }

  const handleFilterByPlate = async () => {
    if (!formData.plate) return
    try {
      const res = await fetch(`/api/rcv/lookup?plate=${encodeURIComponent(formData.plate)}`)
      const data = await res.json()
      if (data.found?.vehicle) {
        const v = data.found.vehicle
        updateFormData({
          brand: v.brand,
          model: v.model,
          year: String(v.year),
          color: v.color,
          vehicle_class: v.class,
          vehicle_type: v.type,
          use_type: v.use_type,
          vin: v.vin || '',
          capacity_persons: String(v.capacity_persons || 2),
          capacity_load: v.capacity_load || '150 kgs',
        })
        setLookupMsg('✅ Vehículo encontrado por placa y autocompletado.')
      } else {
        setLookupMsg('ℹ️ Placa nueva: completa las características del vehículo.')
      }
    } catch {}
  }

  const handleNext = () => {
    if (!formData.plate || !formData.brand || !formData.model || !formData.year) {
      alert('Por favor completa Placa, Marca, Modelo y Año')
      return
    }
    onNext()
  }

  return (
    <div>
      <div className="bg-[#1a2e5a] px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
          2
        </div>
        <div>
          <h2 className="text-white font-semibold">Módulo 2: Filtración y Datos del Vehículo</h2>
          <p className="text-blue-300 text-xs">
            Selecciona la Clase para pre-filtrar capacidades o busca directamente por Placa
          </p>
        </div>
      </div>

      <div className="p-6">
        {lookupMsg && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-xs font-medium">
            {lookupMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Placa + botón filtrar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placa <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.plate}
                onChange={(e) => updateFormData({ plate: e.target.value.toUpperCase() })}
                placeholder="AE6Y92E"
                maxLength={10}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm uppercase font-mono tracking-wider text-gray-900"
              />
              <button
                type="button"
                onClick={handleFilterByPlate}
                className="bg-blue-50 hover:bg-blue-100 text-[#1a2e5a] border border-blue-200 px-3 py-2 rounded-lg text-xs font-semibold"
              >
                🔍
              </button>
            </div>
          </div>

          {/* Clase (con pre-filtro automático) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clase de Vehículo <span className="text-blue-600 text-xs">(Auto-filtra capacidad)</span>
            </label>
            <select
              value={formData.vehicle_class}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm bg-white text-gray-900"
            >
              {VEHICLE_CLASSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca <span className="text-red-500">*</span>
            </label>
            <input
              list="brands-list"
              value={formData.brand}
              onChange={(e) => updateFormData({ brand: e.target.value.toUpperCase() })}
              placeholder="BERA / TOYOTA"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm uppercase text-gray-900"
            />
            <datalist id="brands-list">
              {BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => updateFormData({ model: e.target.value.toUpperCase() })}
              placeholder="BR-150/21"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm uppercase text-gray-900"
            />
          </div>

          {/* Año */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => updateFormData({ year: e.target.value })}
              min="1960"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => updateFormData({ color: e.target.value.toUpperCase() })}
              placeholder="AZUL"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm uppercase text-gray-900"
            />
          </div>

          {/* Serial Carrocería */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial CARROCERÍA (VIN / Chasis) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.vin}
              onChange={(e) => updateFormData({ vin: e.target.value.toUpperCase() })}
              placeholder="8211MBCA3ND035786"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm uppercase font-mono text-gray-900"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => updateFormData({ vehicle_type: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm bg-white text-gray-900"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Uso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uso</label>
            <select
              value={formData.use_type}
              onChange={(e) => updateFormData({ use_type: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm bg-white text-gray-900"
            >
              {USE_TYPES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Capacidad Personas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad Personas
            </label>
            <input
              type="number"
              value={formData.capacity_persons}
              onChange={(e) => updateFormData({ capacity_persons: e.target.value })}
              min="1"
              max="60"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900"
            />
          </div>

          {/* Capacidad Carga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Carga</label>
            <input
              type="text"
              value={formData.capacity_load}
              onChange={(e) => updateFormData({ capacity_load: e.target.value })}
              placeholder="150 kgs"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
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
            Siguiente: Módulo Contrato →
          </button>
        </div>
      </div>
    </div>
  )
}
