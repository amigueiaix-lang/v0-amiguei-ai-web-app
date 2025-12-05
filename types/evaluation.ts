/**
 * Types for Look Evaluation Feature
 */

export interface ClosetItem {
  id: string
  name: string
  category: string
  image_url: string
  ai_analysis?: string | null
  user_id: string
  created_at: string
}

export interface SelectedPieces {
  top: ClosetItem | null
  bottom: ClosetItem | null
  shoes: ClosetItem | null
}

export interface EvaluationPayload {
  user_id: string
  pieces: {
    top_id: string
    top_name: string
    bottom_id: string
    bottom_name: string
    shoes_id: string
    shoes_name: string
  }
  occasion: string
  images: {
    top_url: string
    bottom_url: string
    shoes_url: string
  }
}

export interface EvaluationResult {
  score: number // 0-10
  feedback: string
  positive?: string[]
  improvements?: string[]
  suggestions?: string[]
}

// Helper type for category mapping
export type PieceCategory = 'top' | 'bottom' | 'shoes'

// Categories mapping for Supabase data
export const CATEGORY_MAPPING = {
  top: ['Blusa', 'Camiseta', 'Camisa', 'Jaqueta', 'Casaco'],
  bottom: ['Calça', 'Saia', 'Short', 'Vestido'],
  shoes: ['Tênis', 'Sapato', 'Sandália']
} as const
