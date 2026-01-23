"use client"

import StartupGate from "@/components/StartupGate"

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return <StartupGate>{children}</StartupGate>
}
