"use client"

import { useState } from "react"
import { AmigueiCoin } from "./AmigueiCoin"
import { CoinStore } from "./CoinStore"
import { useCoins } from "@/hooks/useCoins"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CoinBalanceProps {
  className?: string
  variant?: "default" | "compact"
}

/**
 * Coin Balance Component
 * Displays the user's current coin balance in the header
 * Clicking opens the coin store modal
 *
 * @param className - Additional CSS classes
 * @param variant - Display variant (default or compact for mobile)
 *
 * @example
 * <CoinBalance variant="default" />
 */
export function CoinBalance({
  className,
  variant = "default",
}: CoinBalanceProps) {
  const { balance, loading, error } = useCoins()
  const [storeOpen, setStoreOpen] = useState(false)

  const isCompact = variant === "compact"

  return (
    <>
      <button
        onClick={() => setStoreOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2 shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2",
          isCompact && "px-3 py-1.5",
          className
        )}
        title="View and purchase Amiguei.Coins"
        aria-label={`Coin balance: ${balance} coins. Click to purchase more.`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 text-white animate-spin" />
            {!isCompact && (
              <span className="text-sm font-semibold text-white">
                Carregando...
              </span>
            )}
          </>
        ) : error ? (
          <>
            <AmigueiCoin size={isCompact ? "small" : "medium"} />
            <span
              className={cn(
                "font-semibold text-white",
                isCompact ? "text-sm" : "text-base"
              )}
            >
              --
            </span>
          </>
        ) : (
          <>
            <AmigueiCoin size={isCompact ? "small" : "medium"} />
            <span
              className={cn(
                "font-semibold text-white",
                isCompact ? "text-sm" : "text-base"
              )}
            >
              {balance.toLocaleString()}
            </span>
            {!isCompact && (
              <span className="text-xs text-pink-100 hidden sm:inline">
                {balance === 1 ? "coin" : "coins"}
              </span>
            )}
          </>
        )}
      </button>

      {/* Coin Store Modal */}
      <CoinStore open={storeOpen} onClose={() => setStoreOpen(false)} />
    </>
  )
}
