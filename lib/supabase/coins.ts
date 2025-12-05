import { supabase } from "@/lib/supabase"

/**
 * Amiguei.Coins - Coin Management Functions
 * All functions handle errors gracefully and return typed responses
 */

export interface CoinBalance {
  balance: number
  userId: string
}

export interface CoinOperationResult {
  success: boolean
  message: string
  balance?: number
}

/**
 * Get the current coin balance for a user
 * @param userId - The user's UUID from Supabase auth
 * @returns CoinBalance or null if not found
 */
export async function getBalance(userId: string): Promise<CoinBalance | null> {
  try {
    const { data, error } = await supabase
      .from("user_credits")
      .select("balance, user_id")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("❌ Error fetching coin balance:", error)
      return null
    }

    if (!data) {
      console.warn("⚠️ No balance found for user:", userId)
      return null
    }

    return {
      balance: data.balance,
      userId: data.user_id,
    }
  } catch (err) {
    console.error("❌ Exception in getBalance:", err)
    return null
  }
}

/**
 * Deduct coins from a user's balance
 * @param userId - The user's UUID
 * @param amount - Number of coins to deduct (must be positive)
 * @returns Operation result with success status and new balance
 */
export async function deductCoins(
  userId: string,
  amount: number
): Promise<CoinOperationResult> {
  if (amount <= 0) {
    return {
      success: false,
      message: "Amount must be positive",
    }
  }

  try {
    // First, get current balance
    const currentBalance = await getBalance(userId)

    if (!currentBalance) {
      return {
        success: false,
        message: "User balance not found",
      }
    }

    if (currentBalance.balance < amount) {
      return {
        success: false,
        message: "Insufficient coins",
        balance: currentBalance.balance,
      }
    }

    // Deduct coins
    const newBalance = currentBalance.balance - amount
    const { data, error } = await supabase
      .from("user_credits")
      .update({ balance: newBalance })
      .eq("user_id", userId)
      .select("balance")
      .single()

    if (error) {
      console.error("❌ Error deducting coins:", error)
      return {
        success: false,
        message: "Failed to deduct coins",
      }
    }

    // Log transaction
    await logTransaction(userId, -amount, "deduction", "Outfit generation")

    return {
      success: true,
      message: "Coins deducted successfully",
      balance: data.balance,
    }
  } catch (err) {
    console.error("❌ Exception in deductCoins:", err)
    return {
      success: false,
      message: "An error occurred",
    }
  }
}

/**
 * Add coins to a user's balance
 * @param userId - The user's UUID
 * @param amount - Number of coins to add (must be positive)
 * @param reason - Reason for adding coins (e.g., "purchase", "bonus")
 * @returns Operation result with success status and new balance
 */
export async function addCoins(
  userId: string,
  amount: number,
  reason: string = "purchase"
): Promise<CoinOperationResult> {
  if (amount <= 0) {
    return {
      success: false,
      message: "Amount must be positive",
    }
  }

  try {
    // Get current balance
    const currentBalance = await getBalance(userId)

    if (!currentBalance) {
      // If user doesn't have a balance entry, create one
      const { data: newEntry, error: insertError } = await supabase
        .from("user_credits")
        .insert({ user_id: userId, balance: amount })
        .select("balance")
        .single()

      if (insertError) {
        console.error("❌ Error creating user credits:", insertError)
        return {
          success: false,
          message: "Failed to create user credits",
        }
      }

      await logTransaction(userId, amount, "purchase", reason)

      return {
        success: true,
        message: "Coins added successfully",
        balance: newEntry.balance,
      }
    }

    // Add coins to existing balance
    const newBalance = currentBalance.balance + amount
    const { data, error } = await supabase
      .from("user_credits")
      .update({ balance: newBalance })
      .eq("user_id", userId)
      .select("balance")
      .single()

    if (error) {
      console.error("❌ Error adding coins:", error)
      return {
        success: false,
        message: "Failed to add coins",
      }
    }

    // Log transaction
    await logTransaction(userId, amount, "purchase", reason)

    return {
      success: true,
      message: "Coins added successfully",
      balance: data.balance,
    }
  } catch (err) {
    console.error("❌ Exception in addCoins:", err)
    return {
      success: false,
      message: "An error occurred",
    }
  }
}

/**
 * Check if user has sufficient coins
 * @param userId - The user's UUID
 * @param requiredAmount - Minimum coins required
 * @returns true if user has enough coins, false otherwise
 */
export async function hasEnoughCoins(
  userId: string,
  requiredAmount: number
): Promise<boolean> {
  const balance = await getBalance(userId)
  if (!balance) return false
  return balance.balance >= requiredAmount
}

/**
 * Initialize coins for a new user (called by trigger, but can be called manually)
 * @param userId - The user's UUID
 * @param initialAmount - Initial coin amount (default: 3)
 * @returns Operation result
 */
export async function initializeUserCoins(
  userId: string,
  initialAmount: number = 3
): Promise<CoinOperationResult> {
  try {
    const { data, error } = await supabase
      .from("user_credits")
      .insert({ user_id: userId, balance: initialAmount })
      .select("balance")
      .single()

    if (error) {
      // If user already has coins, that's okay
      if (error.code === "23505") {
        return {
          success: true,
          message: "User already has coins initialized",
        }
      }

      console.error("❌ Error initializing coins:", error)
      return {
        success: false,
        message: "Failed to initialize coins",
      }
    }

    await logTransaction(userId, initialAmount, "bonus", "Welcome bonus")

    return {
      success: true,
      message: "Coins initialized successfully",
      balance: data.balance,
    }
  } catch (err) {
    console.error("❌ Exception in initializeUserCoins:", err)
    return {
      success: false,
      message: "An error occurred",
    }
  }
}

/**
 * Log a coin transaction (for history/audit purposes)
 * @param userId - The user's UUID
 * @param amount - Amount of coins (positive for addition, negative for deduction)
 * @param type - Transaction type
 * @param description - Description of the transaction
 */
async function logTransaction(
  userId: string,
  amount: number,
  type: "purchase" | "deduction" | "bonus" | "refund",
  description: string
): Promise<void> {
  try {
    const { error } = await supabase.from("coin_transactions").insert({
      user_id: userId,
      amount,
      transaction_type: type,
      description,
    })

    if (error) {
      console.error("⚠️ Error logging transaction:", error)
      // Don't fail the main operation if logging fails
    }
  } catch (err) {
    console.error("⚠️ Exception in logTransaction:", err)
    // Don't fail the main operation if logging fails
  }
}

/**
 * Get transaction history for a user
 * @param userId - The user's UUID
 * @param limit - Maximum number of transactions to fetch
 * @returns Array of transactions
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
) {
  try {
    const { data, error } = await supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Error fetching transactions:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("❌ Exception in getTransactionHistory:", err)
    return []
  }
}
