export default function AdminHeader({ userEmail }: { userEmail: string }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400">Sistema de Gestión</p>
        <h2 className="text-gray-700 font-semibold">Pólizas RCV</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-gray-400">Sesión activa</p>
          <p className="text-sm text-gray-700 font-medium">{userEmail}</p>
        </div>
        <div className="w-9 h-9 bg-[#1a2e5a] rounded-full flex items-center justify-center text-white text-sm font-bold">
          {userEmail.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
