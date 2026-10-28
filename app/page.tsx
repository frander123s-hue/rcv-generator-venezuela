import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1e3d] to-[#1a3a6e] flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 bg-[#c8a619] rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-2xl">
          🛡️
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">CORPORACIÓN VENEZOLANA</h1>
        <p className="text-[#c8a619] text-lg font-semibold">DE GARANTÍAS R.L.</p>
        <p className="text-blue-300 text-xs mt-1">RIF: J-41285930-7 · SUNACOOP Exp. 381558</p>
        <p className="text-blue-200 text-sm mt-4 mb-8">
          Sistema Oficial de Emisión y Verificación QR de Pólizas de Responsabilidad Civil de Vehículos (RCV)
        </p>
        <Link
          href="/login"
          className="bg-[#c8a619] hover:bg-[#a88810] text-white font-bold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg inline-block"
        >
          Acceder al Panel Administrador →
        </Link>
      </div>
    </div>
  )
}
