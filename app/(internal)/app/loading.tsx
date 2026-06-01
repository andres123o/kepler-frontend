export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
        <p className="text-neutral-600 text-xs">Cargando...</p>
      </div>
    </div>
  )
}
