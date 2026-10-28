'use client'

import { useState } from 'react'

export default function QuickResendEmailButton({
  policyId,
  clientEmail,
}: {
  policyId: string
  clientEmail?: string
}) {
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<string>('')

  if (!clientEmail) return null

  const handleSend = async () => {
    setSending(true)
    setStatus('')
    try {
      const res = await fetch(`/api/rcv/${policyId}/resend-email`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(`Error al enviar correo: ${data.error || 'Error desconocido'}`)
      } else {
        setStatus('Enviado ✅')
      }
    } catch {
      alert('Error de red al enviar correo')
    } finally {
      setSending(false)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      title={`Reenviar póliza a ${clientEmail}`}
      className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1 rounded font-semibold disabled:opacity-50"
    >
      {sending ? 'Enviando...' : status || '📧 Correo'}
    </button>
  )
}
