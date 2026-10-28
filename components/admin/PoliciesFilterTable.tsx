'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PoliciesFilterTable({ initialPolicies }: { initialPolicies: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [classFilter, setClassFilter] = useState('ALL')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string>('')

  const filtered = initialPolicies.filter((p) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      (p.policy_number || '').toLowerCase().includes(q) ||
      (p.clients?.full_name || '').toLowerCase().includes(q) ||
      (p.clients?.cedula_rif || '').toLowerCase().includes(q) ||
      (p.vehicles?.plate || '').toLowerCase().includes(q) ||
      (p.vehicles?.brand || '').toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'expired' && !p.is_active)

    const matchesClass =
      classFilter === 'ALL' || (p.vehicles?.class || '').toUpperCase() === classFilter

    return matchesSearch && matchesStatus && matchesClass
  })

  const handleResendEmail = async (policyId: string) => {
    setSendingId(policyId)
    setFeedback('')
    try {
      const res = await fetch(`/api/rcv/${policyId}/resend-email`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setFeedback(`❌ ${data.error || 'Error al reenviar correo'}`)
      } else {
        setFeedback(`✅ ${data.message}`)
      }
    } catch {
      setFeedback('❌ Error de red al reenviar correo')
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
          {feedback}
        </div>
      )}

      {/* Barra de Filtración */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 font-medium mb-1">
            Buscar por Placa, Cédula/RIF, Beneficiario o Contrato Nro.
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: AI7I16T, 26956521, MARVIN, 0000043117..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1">
            Filtrar por Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
          >
            <option value="all">Todas las pólizas</option>
            <option value="active">✅ Solo Vigentes</option>
            <option value="expired">⏰ Solo Vencidas</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1">
            Filtrar por Clase Vehículo
          </label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
          >
            <option value="ALL">Todas las clases</option>
            <option value="MOTO">MOTO</option>
            <option value="AUTOMOVIL">AUTOMOVIL</option>
            <option value="CAMIONETA">CAMIONETA</option>
            <option value="RUSTICO">RUSTICO</option>
            <option value="CAMION">CAMION</option>
          </select>
        </div>
      </div>

      {/* Vista Móvil en Tarjetas (< md) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No se encontraron pólizas con los filtros seleccionados.
          </div>
        ) : (
          filtered.map((policy) => (
            <div
              key={policy.id}
              className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    N° {policy.policy_number}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      policy.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {policy.is_active ? '✅ Vigente' : '❌ Vencida'}
                  </span>
                  <span className="font-bold text-[#1a2e5a] text-sm">
                    {policy.currency === 'EUR' ? '€' : policy.currency === 'USD' ? '$' : 'Bs.'}
                    {Number(policy.premium_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-900 text-sm">{policy.clients?.full_name}</p>
                <p className="text-xs text-gray-500">
                  {policy.clients?.cedula_rif}
                  {policy.clients?.email ? ` · ${policy.clients.email}` : ''}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-2.5 text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {policy.vehicles?.plate}
                  </span>{' '}
                  <span className="text-gray-600">
                    {policy.vehicles?.brand} {policy.vehicles?.model} ({policy.vehicles?.year})
                  </span>
                </div>
                <div className="text-right text-[11px] text-gray-500">
                  <div>{policy.start_date}</div>
                  <div className="font-semibold text-gray-700">→ {policy.end_date}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`/api/rcv/${policy.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-semibold"
                >
                  📄 PDF
                </a>
                <Link
                  href={`/rcv/${policy.id}`}
                  target="_blank"
                  className="flex-1 text-center text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-semibold"
                >
                  📱 QR
                </Link>
                {policy.clients?.email && (
                  <button
                    onClick={() => handleResendEmail(policy.id)}
                    disabled={sendingId === policy.id}
                    className="flex-1 text-center text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {sendingId === policy.id ? 'Enviando...' : '📧 Correo'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla para Escritorio (>= md) */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a2e5a] text-white">
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Contrato Nro.</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Beneficiario</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Vehículo</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Vigencia</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Pago Total</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No se encontraron pólizas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-blue-700 font-bold">
                        {policy.policy_number}
                      </div>
                      <div className="text-gray-400 text-xs">Recibo: {policy.receipt_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-xs">
                        {policy.clients?.full_name}
                      </div>
                      <div className="text-gray-500 text-xs">{policy.clients?.cedula_rif}</div>
                      <div className="text-gray-400 text-xs">{policy.clients?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {policy.vehicles?.plate}
                      </span>
                      <div className="text-gray-500 text-xs mt-1">
                        {policy.vehicles?.class} · {policy.vehicles?.brand} {policy.vehicles?.model}{' '}
                        ({policy.vehicles?.year})
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>Desde: {policy.start_date}</div>
                      <div
                        className={
                          policy.is_active ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'
                        }
                      >
                        Hasta: {policy.end_date}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1a2e5a]">
                      {policy.currency === 'EUR' ? '€' : policy.currency === 'USD' ? '$' : 'Bs.'}
                      {Number(policy.premium_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          policy.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {policy.is_active ? '✅ Vigente' : '❌ Vencida'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <a
                          href={`/api/rcv/${policy.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1 rounded font-semibold"
                        >
                          📄 PDF
                        </a>
                        <Link
                          href={`/rcv/${policy.id}`}
                          target="_blank"
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded font-semibold"
                        >
                          📱 QR
                        </Link>
                        {policy.clients?.email && (
                          <button
                            onClick={() => handleResendEmail(policy.id)}
                            disabled={sendingId === policy.id}
                            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1 rounded font-semibold disabled:opacity-50"
                          >
                            {sendingId === policy.id ? 'Enviando...' : '📧 Enviar Correo'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
