"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  getBalance,
  deductCoins,
  addCoins,
  hasEnoughCoins,
  type CoinBalance,
  type CoinOperationResult,
} from "@/lib/supabase/coins"

interface UseCoinsReturn {
  balance: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  deduct: (amount: number) => Promise<CoinOperationResult>
  add: (amount: number, reason?: string) => Promise<CoinOperationResult>
  hasEnough: (amount: number) => boolean
}

/**
 * Custom hook for managing Amiguei.Coins
 * Automatically fetches and manages coin balance for the current user
 *
 * @example
 * const { balance, loading, deduct, refresh } = useCoins()
 *
 * // Deduct coins
 * const result = await deduct(1)
 * if (result.success) {
 *   console.log("Coins deducted! New balance:", result.balance)
 * }
 */
export function useCoins(): UseCoinsReturn {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  /**
   * Fetch the current user's coin balance
   */
  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("User not authenticated")
        setBalance(0)
        setLoading(false)
        return
      }

      setUserId(user.id)

      // Fetch balance
      const balanceData = await getBalance(user.id)

      if (!balanceData) {
        setBalance(0)
        setError("Balance not found")
      } else {
        setBalance(balanceData.balance)
        setError(null)
      }
    } catch (err) {
      console.error("❌ Error in fetchBalance:", err)
      setError("Failed to fetch balance")
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Refresh the balance from the database
   */
  const refresh = useCallback(async () => {
    await fetchBalance()
  }, [fetchBalance])

  /**
   * Deduct coins from the user's balance
   */
  const deduct = useCallback(
    async (amount: number): Promise<CoinOperationResult> => {
      if (!userId) {
        return {
          success: false,
          message: "User not authenticated",
        }
      }

      const result = await deductCoins(userId, amount)

      if (result.success && result.balance !== undefined) {
        setBalance(result.balance)
      }

      return result
    },
    [userId]
  )

  /**
   * Add coins to the user's balance
   */
  const add = useCallback(
    async (
      amount: number,
      reason: string = "purchase"
    ): Promise<CoinOperationResult> => {
      if (!userId) {
        return {
          success: false,
          message: "User not authenticated",
        }
      }

      const result = await addCoins(userId, amount, reason)

      if (result.success && result.balance !== undefined) {
        setBalance(result.balance)
      }

      return result
    },
    [userId]
  )

  /**
   * Check if the user has enough coins
   */
  const hasEnough = useCallback(
    (amount: number): boolean => {
      return balance >= amount
    },
    [balance]
  )

  // Fetch balance on mount
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Subscribe to auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id)
        fetchBalance()
      } else if (event === "SIGNED_OUT") {
        setUserId(null)
        setBalance(0)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchBalance])

  // Subscribe to real-time balance updates
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`user_credits:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("💰 Balance updated:", payload)
          if (payload.new && "balance" in payload.new) {
            setBalance(payload.new.balance as number)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return {
    balance,
    loading,
    error,
    refresh,
    deduct,
    add,
    hasEnough,
  }
}
