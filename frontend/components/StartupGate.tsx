"use client"

import { useBackendHealth } from "@/hooks/useBackendHealth"
import { BackendLoader } from "@/components/BackendLoader"

export default function StartupGate({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready, seconds } = useBackendHealth()

  if (!ready) {
    return <BackendLoader seconds={seconds} />
  }

  return <>{children}</>
}
