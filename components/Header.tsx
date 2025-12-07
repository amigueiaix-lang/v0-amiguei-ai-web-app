"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Logo } from "./logo"

/**
 * Global Header Component
 */
export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      setIsLoading(false)
    }

    checkAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {!isLoading && isLoggedIn && (
            <nav className="flex items-center gap-6">
              <Link
                href="/closet"
                className="text-sm font-medium text-gray-700 hover:text-[#FF69B4] transition-colors"
              >
                Closet
              </Link>
              <Link
                href="/amigos"
                className="text-sm font-medium text-gray-700 hover:text-[#FF69B4] transition-colors"
              >
                Amigos
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
