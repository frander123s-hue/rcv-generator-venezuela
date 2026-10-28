'use client'

import { useRef, useState } from 'react'
import type { FormData } from '@/app/admin/nueva-poliza/page'

interface StepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  onNext: () => void
}

const CEDULA_PREFIXES = ['V', 'E', 'J', 'G', 'P']

export default function Step1Client({ formData, updateFormData, onNext }: StepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searching, setSearching] = useState(false)
  const [lookupMsg, setLookupMsg] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      updateFormData({
        photo_file: file,
        photo_preview: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleFilterByCedula = async () => {
    if (!formData.cedula_rif) return
    setSearching(true)
    setLookupMsg('')
    try {
      const fullCedula = `${formData.cedula_prefix}-${formData.cedula_rif}`
      const res = await fetch(`/api/rcv/lookup?cedula=${encodeURIComponent(fullCedula)}`)
      const data = await res.json()
      if (data.found?.client) {
        const c = data.found.client
        updateFormData({
          full_name: c.full_name,
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          ...(c.photo_url ? { photo_preview: c.photo_url } : {}),
        })
        setLookupMsg('✅ Cliente encontrado y cargado automáticamente.')
      } else {
        setLookupMsg('ℹ️ Cliente nuevo: llena sus datos a continuación.')
      }
    } catch {
      setLookupMsg('')
    } finally {
      setSearching(false)
    }
  }

  const loadSampleData = () => {
    updateFormData({
      cedula_prefix: 'V',
      cedula_rif: '30629617',
      full_name: 'MELVIN PASTOR PALACIOS PADRON',
      phone: '0412-5559876',
      email: 'melvin.palacios@ejemplo.com',
      address: 'LOS TEQUES, ESTADO MIRANDA',
      plate: 'AE6Y92E',
      brand: 'BERA',
      model: 'BR-150/21',
      year: '2022',
      color: 'AZUL',
      vehicle_class: 'MOTO',
      vehicle_type: 'PASEO',
      use_type: 'PARTICULAR',
      vin: '8211MBCA3ND035786',
      capacity_persons: '2',
      capacity_load: '150 kgs',
      premium_amount: '15.00',
      currency: 'EUR',
    })
    setLookupMsg('✅ Datos de prueba del documento cargados.')
  }

  const handleNext = () => {
    if (!formData.full_name || !formData.cedula_rif) {
      alert('Por favor completa el Nombre del Beneficiario y la Cédula/RIF')
      return
    }
    onNext()
  }

  return (
    <div>
      <div className="bg-[#1a2e5a] px-4 sm:px-6 py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
            1
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm sm:text-base">
              Módulo 1: Filtración y Datos del Cliente
            </h2>
            <p className="text-blue-300 text-[11px] sm:text-xs">
              Busca por Cédula/RIF o registra al beneficiario con su fotografía para el PDF
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadSampleData}
          className="text-xs bg-[#c8a619] hover:bg-[#b09115] text-white font-semibold px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto text-center"
        >
          ⚡ Autocompletar Ejemplo del PDF
        </button>
      </div>

      <div className="p-4 sm:p-6">
        {lookupMsg && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-lg text-xs font-medium">
            {lookupMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Foto del Cliente */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center lg:text-left">
              Foto del Cliente{' '}
              <span className="text-blue-600 text-xs">(Esquina superior derecha del PDF)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-[#1a2e5a] rounded-xl overflow-hidden transition-colors bg-gray-50 hover:bg-blue-50 flex items-center justify-center max-w-[140px] sm:max-w-[180px] lg:max-w-none mx-auto"
              style={{ aspectRatio: '3/4' }}
            >
              {formData.photo_preview ? (
                <img
                  src={formData.photo_preview}
                  alt="Foto del Cliente"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-3 sm:p-4">
                  <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">📷</div>
                  <p className="text-gray-700 text-xs sm:text-sm font-semibold">
                    Subir Foto del Cliente
                  </p>
                  <p className="text-gray-400 text-[11px] sm:text-xs mt-1">JPG o PNG tipo carnet</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {formData.photo_preview && (
              <button
                type="button"
                onClick={() => {
                  updateFormData({ photo_file: null, photo_preview: '' })
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-center"
              >
                ✕ Quitar foto
              </button>
            )}
          </div>

          {/* Campos del Cliente */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtro por Cédula / RIF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                C.I / RIF del Beneficiario <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <select
                  value={formData.cedula_prefix}
                  onChange={(e) => updateFormData({ cedula_prefix: e.target.value })}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm bg-white text-gray-900 font-semibold"
                >
                  {CEDULA_PREFIXES.map((p) => (
                    <option key={p} value={p}>
                      {p}-
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.cedula_rif}
                  onChange={(e) => updateFormData({ cedula_rif: e.target.value.replace(/\D/g, '') })}
                  placeholder="30629617"
                  className="flex-1 min-w-[130px] px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900 font-mono"
                />
                <button
                  type="button"
                  onClick={handleFilterByCedula}
                  disabled={searching}
                  className="w-full sm:w-auto bg-blue-50 hover:bg-blue-100 text-[#1a2e5a] border border-blue-200 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  {searching ? 'Buscando...' : '🔍 Filtrar Cliente'}
                </button>
              </div>
            </div>

            {/* Beneficiario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beneficiario / Contratante (Nombre Completo) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => updateFormData({ full_name: e.target.value.toUpperCase() })}
                placeholder="MELVIN PASTOR PALACIOS PADRON"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm uppercase text-gray-900"
              />
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico del Cliente{' '}
                <span className="text-green-600 text-xs font-semibold">
                  (Recibirá el PDF automáticamente al finalizar)
                </span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder="cliente@correo.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                placeholder="0412-1234567"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm text-gray-900"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal / Habitación</label>
              <textarea
                value={formData.address}
                onChange={(e) => updateFormData({ address: e.target.value })}
                placeholder="Av. Principal, Edif. / Casa, Ciudad, Estado..."
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-sm resize-none text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto bg-[#1a2e5a] hover:bg-[#0f1e3d] text-white px-6 py-3 sm:py-2.5 rounded-lg font-medium transition-colors"
          >
            Siguiente: Módulo Vehículo →
          </button>
        </div>
      </div>
    </div>
  )
}
