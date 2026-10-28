'use client'

import { useState, useEffect } from 'react'
import Step1Client from '@/components/admin/PolicyForm/Step1Client'
import Step2Vehicle from '@/components/admin/PolicyForm/Step2Vehicle'
import Step3Policy from '@/components/admin/PolicyForm/Step3Policy'
import Step4Coverage from '@/components/admin/PolicyForm/Step4Coverage'
import Step5Preview from '@/components/admin/PolicyForm/Step5Preview'

export type FormData = {
  // Módulo 1 - Cliente
  full_name: string
  cedula_rif: string
  cedula_prefix: string
  phone: string
  email: string
  address: string
  photo_file: File | null
  photo_preview: string

  // Módulo 2 - Vehículo
  plate: string
  brand: string
  model: string
  year: string
  color: string
  vehicle_class: string
  vehicle_type: string
  use_type: string
  vin: string
  capacity_persons: string
  capacity_load: string

  // Módulo 3 - Póliza
  policy_number: string
  start_date: string
  end_date: string
  premium_amount: string
  currency: string
  advisor: string
  supervisor: string

  // Módulo 4 - Garantías
  rc_cosas_amount: string
  rc_personas_amount: string
  exceso_garantia_amount: string
  asistencia_juridica_amount: string
  muerte_conductor_amount: string
  include_invalidity: boolean
  include_medical: boolean
  include_funeral: boolean
}

const defaultFormData: FormData = {
  full_name: '',
  cedula_rif: '',
  cedula_prefix: 'V',
  phone: '',
  email: '',
  address: '',
  photo_file: null,
  photo_preview: '',
  plate: '',
  brand: 'BERA',
  model: 'BR-150/21',
  year: '2022',
  color: 'AZUL',
  vehicle_class: 'MOTO',
  vehicle_type: 'PASEO',
  use_type: 'PARTICULAR',
  vin: '',
  capacity_persons: '2',
  capacity_load: '150 kgs',
  policy_number: '0000043114',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  premium_amount: '15.00',
  currency: 'EUR',
  advisor: 'OFICINA PRINCIPAL',
  supervisor: 'GERENCIA GENERAL',
  rc_cosas_amount: '2000.00',
  rc_personas_amount: '2505.00',
  exceso_garantia_amount: '250.00',
  asistencia_juridica_amount: '250.00',
  muerte_conductor_amount: '500.00',
  include_invalidity: true,
  include_medical: true,
  include_funeral: true,
}

const steps = [
  { id: 1, label: 'Módulo 1: Cliente + Foto', icon: '👤' },
  { id: 2, label: 'Módulo 2: Vehículo', icon: '🏍️' },
  { id: 3, label: 'Módulo 3: Vigencia y Pago', icon: '📋' },
  { id: 4, label: 'Módulo 4: Garantías', icon: '🛡️' },
  { id: 5, label: 'Módulo 5: Emitir PDF + Correo', icon: '✅' },
]

export default function NuevaPolizaPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    policyId?: string
    policyNumber?: string
    pdfUrl?: string
    qrUrl?: string
    emailSent?: boolean
    emailWarning?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/rcv/lookup?nextNumber=1')
      .then((r) => r.json())
      .then((d) => {
        if (d.policy_number) {
          setFormData((prev) => ({ ...prev, policy_number: d.policy_number }))
        }
      })
      .catch(() => {})
  }, [])

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 5))
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'photo_file' && value instanceof File) {
          fd.append('photo_file', value)
        } else if (key !== 'photo_preview' && key !== 'photo_file') {
          fd.append(key, String(value))
        }
      })

      const response = await fetch('/api/rcv/create', {
        method: 'POST',
        body: fd,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la póliza')
      }

      setSubmitResult({
        success: true,
        policyId: result.policy_id,
        policyNumber: result.policy_number,
        pdfUrl: result.pdf_url,
        qrUrl: result.qr_url,
        emailSent: result.email_sent,
        emailWarning: result.email_warning,
      })
    } catch (err: any) {
      setSubmitResult({
        success: false,
        error: err.message || 'Error desconocido',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitResult?.success) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-2xl border border-green-200 p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Póliza RCV Generada Exitosamente!
          </h2>
          <p className="text-gray-700 mb-2">
            Contrato / Recibo Nro.:{' '}
            <span className="font-mono font-bold text-blue-700">
              {submitResult.policyNumber}
            </span>
          </p>

          {submitResult.emailSent ? (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-5">
              📧 {submitResult.emailWarning || 'Correo enviado automáticamente al cliente con el PDF adjunto.'}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm mb-5">
              ⚠️ El PDF se creó y guardó correctamente.{' '}
              {submitResult.emailWarning ||
                'Cuando cargues tu GMAIL_APP_PASSWORD o RESEND_API_KEY se enviará por correo automáticamente.'}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={`/api/rcv/${submitResult.policyId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
            >
              📄 Ver / Descargar PDF RCV
            </a>
            <a
              href={`/rcv/${submitResult.policyId}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#1a2e5a] hover:bg-[#0f1e3d] text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
            >
              📱 Abrir Página Pública del QR
            </a>
            <button
              onClick={() => {
                setFormData(defaultFormData)
                setCurrentStep(1)
                setSubmitResult(null)
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              + Crear Otra Póliza
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Generador de Póliza RCV por Módulos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Filtra o llena cada módulo con el dato necesario para emitir el PDF oficial con QR y foto del asegurado
        </p>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep === step.id
                      ? 'bg-[#1a2e5a] text-white shadow-lg scale-110'
                      : currentStep > step.id
                      ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.icon}
                </button>
                <span
                  className={`text-xs mt-1 font-medium hidden sm:block text-center max-w-[110px] ${
                    currentStep === step.id
                      ? 'text-[#1a2e5a] font-bold'
                      : currentStep > step.id
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {currentStep === 1 && (
          <Step1Client formData={formData} updateFormData={updateFormData} onNext={nextStep} />
        )}
        {currentStep === 2 && (
          <Step2Vehicle
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 3 && (
          <Step3Policy
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 4 && (
          <Step4Coverage
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 5 && (
          <Step5Preview
            formData={formData}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={submitResult?.error}
          />
        )}
      </div>
    </div>
  )
}
