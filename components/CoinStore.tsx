"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AmigueiCoin } from "./AmigueiCoin"
import { useCoins } from "@/hooks/useCoins"
import { Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CoinStoreProps {
  open: boolean
  onClose: () => void
}

interface CoinPackage {
  id: string
  coins: number
  price: number
  pricePerLook: number
  badge?: "popular" | "best-value"
  badgeText?: string
}

const COIN_PACKAGES: CoinPackage[] = [
  {
    id: "starter",
    coins: 10,
    price: 9.90,
    pricePerLook: 0.99,
  },
  {
    id: "popular",
    coins: 25,
    price: 19.90,
    pricePerLook: 0.80,
    badge: "popular",
    badgeText: "MAIS POPULAR",
  },
  {
    id: "plus",
    coins: 50,
    price: 34.90,
    pricePerLook: 0.70,
  },
  {
    id: "premium",
    coins: 100,
    price: 59.90,
    pricePerLook: 0.60,
    badge: "best-value",
    badgeText: "MELHOR VALOR",
  },
]

/**
 * Coin Store Modal Component
 * Displays available coin packages for purchase
 *
 * @param open - Whether the modal is open
 * @param onClose - Callback to close the modal
 *
 * @example
 * <CoinStore open={isOpen} onClose={() => setIsOpen(false)} />
 */
export function CoinStore({ open, onClose }: CoinStoreProps) {
  const { balance } = useCoins()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  const handlePurchase = (pkg: CoinPackage) => {
    setSelectedPackage(pkg.id)
    // TODO: Integrate with payment gateway (Stripe, Mercado Pago, etc.)
    alert(`Pagamento em breve!\n\nVocê selecionou:\n${pkg.coins} coins por R$ ${pkg.price.toFixed(2)}`)
    setSelectedPackage(null)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                Comprar Amiguei.Coins
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Escolha o pacote ideal para você e continue criando looks incríveis!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Seu saldo atual:
            </span>
            <div className="flex items-center gap-2">
              <AmigueiCoin size="medium" animated />
              <span className="text-2xl font-bold text-gray-900">
                {balance}
              </span>
              <span className="text-sm text-gray-600">
                {balance === 1 ? "coin" : "coins"}
              </span>
            </div>
          </div>
        </div>

        {/* Coin Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {COIN_PACKAGES.map((pkg) => (
            <CoinPackageCard
              key={pkg.id}
              package={pkg}
              onPurchase={handlePurchase}
              isLoading={selectedPackage === pkg.id}
              disabled={selectedPackage !== null && selectedPackage !== pkg.id}
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Como funcionam os Amiguei.Coins?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Cada look gerado custa 1 Amiguei.Coin</li>
                <li>Você pode trocar peças individuais sem custo adicional</li>
                <li>Seus coins nunca expiram</li>
                <li>Novos usuários ganham 3 coins grátis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Close Button (mobile) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors sm:hidden"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </DialogContent>
    </Dialog>
  )
}

interface CoinPackageCardProps {
  package: CoinPackage
  onPurchase: (pkg: CoinPackage) => void
  isLoading: boolean
  disabled: boolean
}

function CoinPackageCard({
  package: pkg,
  onPurchase,
  isLoading,
  disabled,
}: CoinPackageCardProps) {
  const isPopular = pkg.badge === "popular"
  const isBestValue = pkg.badge === "best-value"

  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl border-2 p-6 transition-all",
        "hover:shadow-xl hover:scale-105",
        isPopular && "border-pink-400 shadow-lg",
        isBestValue && "border-purple-400 shadow-lg",
        !isPopular && !isBestValue && "border-gray-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Badge */}
      {pkg.badge && pkg.badgeText && (
        <div
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md",
            isPopular && "bg-gradient-to-r from-pink-500 to-pink-600",
            isBestValue && "bg-gradient-to-r from-purple-500 to-purple-600"
          )}
        >
          {pkg.badgeText}
        </div>
      )}

      {/* Coin Count */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AmigueiCoin size="large" animated />
          <span className="text-4xl font-bold text-gray-900">{pkg.coins}</span>
        </div>
        <p className="text-sm text-gray-600">Amiguei.Coins</p>
      </div>

      {/* Price */}
      <div className="text-center mb-2">
        <p className="text-3xl font-bold text-gray-900">
          R$ {pkg.price.toFixed(2)}
        </p>
      </div>

      {/* Price per Look */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">
          R$ {pkg.pricePerLook.toFixed(2)} por look
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Features */}
      <ul className="space-y-2 mb-6 text-sm text-gray-600">
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
          {pkg.coins} looks personalizados
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
          Trocas ilimitadas de peças
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
          Coins nunca expiram
        </li>
      </ul>

      {/* Purchase Button */}
      <button
        onClick={() => onPurchase(pkg)}
        disabled={disabled || isLoading}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-white transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          isPopular && "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 focus:ring-pink-500",
          isBestValue && "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:ring-purple-500",
          !isPopular && !isBestValue && "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {isLoading ? "Processando..." : "Comprar Agora"}
      </button>
    </div>
  )
}
