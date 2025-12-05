"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface CoinsContextType {
  coins: number
  addCoins: (amount: number) => void
  deductCoins: (amount: number) => boolean
  hasEnoughCoins: (amount: number) => boolean
}

const CoinsContext = createContext<CoinsContextType | undefined>(undefined)

/**
 * CoinsProvider - Visual-only coins system for investor demo
 *
 * This is a frontend-only implementation that:
 * - Stores coins in React state (resets on page reload)
 * - Does NOT persist to database
 * - Perfect for demonstrations
 *
 * Users start with 3 coins by default.
 */
export function CoinsProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState(3) // Start with 3 coins

  const addCoins = (amount: number) => {
    setCoins((prev) => prev + amount)
  }

  const deductCoins = (amount: number): boolean => {
    if (coins >= amount) {
      setCoins((prev) => prev - amount)
      return true
    }
    return false
  }

  const hasEnoughCoins = (amount: number): boolean => {
    return coins >= amount
  }

  return (
    <CoinsContext.Provider
      value={{ coins, addCoins, deductCoins, hasEnoughCoins }}
    >
      {children}
    </CoinsContext.Provider>
  )
}

export function useCoins() {
  const context = useContext(CoinsContext)
  if (context === undefined) {
    throw new Error("useCoins must be used within CoinsProvider")
  }
  return context
}
