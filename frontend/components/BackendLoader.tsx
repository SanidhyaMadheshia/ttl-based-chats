"use client"

export function BackendLoader({ seconds }: { seconds: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-sm opacity-80">
          Backend starting… {seconds}s
        </p>
      </div>
    </div>
  )
}
