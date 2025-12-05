import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Header } from "@/components/Header"
import { Toaster } from "sonner"
import { CoinsProvider } from "@/contexts/CoinsContext"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Amiguei.AI - Seu Assistente de Moda Pessoal",
  description: "Organize seu closet, descubra looks perfeitos e avalie suas combinações com inteligência artificial",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <CoinsProvider>
          <Header />
          {children}
          <Analytics />
          <Toaster position="top-center" richColors />
        </CoinsProvider>
      </body>
    </html>
  )
}
