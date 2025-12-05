"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CoinBalance } from "./CoinBalance"
import { supabase } from "@/lib/supabase"
import { Logo } from "./logo"

/**
 * Global Header Component
 * Displays the logo and coin balance (when user is logged in)
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
        <div className="flex items-center justify-end h-16">
          {/* Coin Balance (only show when logged in) */}
          <div className="flex items-center gap-4">
            {!isLoading && isLoggedIn && (
              <CoinBalance variant="default" className="hidden sm:flex" />
            )}
            {!isLoading && isLoggedIn && (
              <CoinBalance variant="compact" className="flex sm:hidden" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
