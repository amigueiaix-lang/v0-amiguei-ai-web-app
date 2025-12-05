import { cn } from "@/lib/utils"

interface AmigueiCoinProps {
  size?: "small" | "medium" | "large" | "xlarge"
  className?: string
  animated?: boolean
}

const sizeMap = {
  small: {
    container: "w-6 h-6",
    text: "text-xs",
  },
  medium: {
    container: "w-8 h-8",
    text: "text-sm",
  },
  large: {
    container: "w-12 h-12",
    text: "text-lg",
  },
  xlarge: {
    container: "w-16 h-16",
    text: "text-2xl",
  },
}

/**
 * Amiguei.Coin Icon Component
 * Displays the Amiguei.Coins virtual currency icon
 *
 * @param size - Size of the coin (small, medium, large, xlarge)
 * @param className - Additional CSS classes
 * @param animated - Whether to animate the coin on hover
 *
 * @example
 * <AmigueiCoin size="medium" animated />
 */
export function AmigueiCoin({
  size = "medium",
  className,
  animated = false,
}: AmigueiCoinProps) {
  const { container, text } = sizeMap[size]

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 shadow-md ring-2 ring-pink-300 ring-opacity-50",
        container,
        animated && "transition-transform duration-200 hover:scale-110 hover:rotate-12",
        className
      )}
      title="Amiguei.Coin"
      role="img"
      aria-label="Amiguei Coin"
    >
      <span
        className={cn(
          "font-serif font-bold text-white drop-shadow-sm",
          text
        )}
      >
        A.
      </span>

      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

      {/* Shine effect */}
      <div className="absolute top-1 left-1 w-1/3 h-1/3 rounded-full bg-white/40 blur-sm" />
    </div>
  )
}

/**
 * Amiguei.Coin with Count
 * Displays the coin icon with a numeric count next to it
 *
 * @param count - Number of coins to display
 * @param size - Size of the coin
 * @param className - Additional CSS classes
 *
 * @example
 * <AmigueiCoinCount count={10} size="medium" />
 */
interface AmigueiCoinCountProps {
  count: number
  size?: "small" | "medium" | "large"
  className?: string
}

export function AmigueiCoinCount({
  count,
  size = "medium",
  className,
}: AmigueiCoinCountProps) {
  const textSizeMap = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <AmigueiCoin size={size} animated />
      <span className={cn("font-semibold text-gray-800", textSizeMap[size])}>
        {count.toLocaleString()}
      </span>
    </div>
  )
}
