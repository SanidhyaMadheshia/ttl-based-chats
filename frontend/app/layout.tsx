import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
// import { Analytics } from "@/components/"
import "./globals.css"
import { useBackendHealth } from "@/hooks/useBackendHealth"
import { BackendLoader } from "@/components/BackendLoader"
const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ephemeral Chats- Secure Temporary Chat",
  description: "Real-time chat with automatic expiration. No signup, no storage. Just connect via room ID and chat.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { ready, seconds } = useBackendHealth()

  if (!ready) {
    return (
      <html>
        <body>
          <BackendLoader seconds={seconds} />
        </body>
      </html>
    )
  }
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        {children}
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
