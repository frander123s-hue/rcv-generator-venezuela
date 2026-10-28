export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center text-white text-center p-4">
      <div>
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">Póliza no encontrada</h1>
        <p className="text-blue-300">
          El código QR escaneado no corresponde a ninguna póliza registrada.
        </p>
      </div>
    </div>
  )
}
