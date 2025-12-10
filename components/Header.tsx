"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"
import { ProfileAvatar } from "@/components/ProfileAvatar"

interface HeaderProps {
  showBackButton?: boolean
  backButtonHref?: string
  backButtonText?: string
}

export function Header({
  showBackButton = false,
  backButtonHref = "/",
  backButtonText = "Voltar"
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left side - Back button or empty space */}
        <div className="w-24">
          {showBackButton && (
            <Link
              href={backButtonHref}
              className="flex items-center gap-2 text-gray-700 hover:text-[#FF69B4] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">{backButtonText}</span>
            </Link>
          )}
        </div>

        {/* Center - Logo */}
        <div className="flex-1 flex justify-center">
          <Logo />
        </div>

        {/* Right side - Profile Avatar */}
        <div className="w-24 flex justify-end">
          <ProfileAvatar />
        </div>
      </div>
    </header>
  )
}
