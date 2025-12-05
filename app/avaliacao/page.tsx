"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Search, X, Star, Loader2, Shirt, AlertCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import { supabase } from "@/lib/supabase"
import type { ClosetItem, SelectedPieces, EvaluationPayload, EvaluationResult } from "@/types/evaluation"
import { CATEGORY_MAPPING } from "@/types/evaluation"
import { useCoins } from "@/hooks/useCoins"
import { CoinStore } from "@/components/CoinStore"
import { AmigueiCoin } from "@/components/AmigueiCoin"
import { toast } from "sonner"

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function AvaliacaoPage() {
  // State
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPieces, setSelectedPieces] = useState<SelectedPieces>({
    top: null,
    bottom: null,
    shoes: null
  })
  const [occasion, setOccasion] = useState("")
  const [searchTop, setSearchTop] = useState("")
  const [searchBottom, setSearchBottom] = useState("")
  const [searchShoes, setSearchShoes] = useState("")
  const [focusedField, setFocusedField] = useState<'top' | 'bottom' | 'shoes' | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [userRating, setUserRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [showInsufficientCoinsModal, setShowInsufficientCoinsModal] = useState(false)
  const [showCoinStore, setShowCoinStore] = useState(false)

  // Coins hook
  const { balance, deduct, hasEnough, refresh: refreshBalance } = useCoins()

  // Debounced search values
  const debouncedSearchTop = useDebounce(searchTop, 300)
  const debouncedSearchBottom = useDebounce(searchBottom, 300)
  const debouncedSearchShoes = useDebounce(searchShoes, 300)

  // Fetch closet items from Supabase
  useEffect(() => {
    fetchClosetItems()
  }, [])

  const fetchClosetItems = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("User not authenticated")
        setLoading(false)
        return
      }

      // Fetch closet items
      const { data, error } = await supabase
        .from("closet_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching closet items:", error)
        return
      }

      setClosetItems(data || [])
    } catch (err) {
      console.error("Exception fetching closet:", err)
    } finally {
      setLoading(false)
    }
  }

  // Filter items by category and search
  const filterItems = useCallback((categories: string[], searchTerm: string) => {
    return closetItems.filter(
      (item) =>
        categories.includes(item.category) &&
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.ai_analysis && item.ai_analysis.toLowerCase().includes(searchTerm.toLowerCase())))
    )
  }, [closetItems])

  const topItems = filterItems(CATEGORY_MAPPING.top as unknown as string[], debouncedSearchTop)
  const bottomItems = filterItems(CATEGORY_MAPPING.bottom as unknown as string[], debouncedSearchBottom)
  const shoesItems = filterItems(CATEGORY_MAPPING.shoes as unknown as string[], debouncedSearchShoes)

  // Handle piece selection
  const handleSelectPiece = (type: keyof SelectedPieces, item: ClosetItem) => {
    setSelectedPieces(prev => ({
      ...prev,
      [type]: item
    }))

    // Update search field, clear it, and close dropdown
    if (type === "top") {
      setSearchTop("")
      setFocusedField(null)
    } else if (type === "bottom") {
      setSearchBottom("")
      setFocusedField(null)
    } else {
      setSearchShoes("")
      setFocusedField(null)
    }
  }

  // Handle piece removal
  const handleRemovePiece = (type: keyof SelectedPieces) => {
    setSelectedPieces(prev => ({
      ...prev,
      [type]: null
    }))

    if (type === "top") setSearchTop("")
    else if (type === "bottom") setSearchBottom("")
    else setSearchShoes("")
  }

  // Validation
  const selectedCount = [selectedPieces.top, selectedPieces.bottom, selectedPieces.shoes].filter(Boolean).length
  const canSubmit = () => {
    return (
      selectedPieces.top !== null &&
      selectedPieces.bottom !== null &&
      selectedPieces.shoes !== null &&
      occasion.trim().length > 0
    )
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!canSubmit()) return

    try {
      setSubmitting(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("User not authenticated")
        toast.error("❌ Você precisa estar logado para avaliar um look")
        return
      }

      // 💰 VERIFICAR SALDO DE COINS ANTES DE AVALIAR LOOK
      if (!hasEnough(1)) {
        setSubmitting(false)
        setShowInsufficientCoinsModal(true)
        return
      }

      // 💰 DEDUZIR 1 COIN ANTES DE CHAMAR O N8N
      const deductResult = await deduct(1)
      if (!deductResult.success) {
        console.error("❌ Falha ao deduzir coin:", deductResult.message)
        toast.error("❌ Erro ao processar pagamento", {
          description: "Não foi possível debitar o coin. Tente novamente.",
        })
        return
      }

      console.log("💰 1 coin deduzido. Novo saldo:", deductResult.balance)
      toast.info("💰 1 coin debitado", {
        description: `Saldo restante: ${deductResult.balance} coins`,
        duration: 3000,
      })

      // Prepare payload
      const payload: EvaluationPayload = {
        user_id: user.id,
        pieces: {
          top_id: selectedPieces.top!.id,
          top_name: selectedPieces.top!.name,
          bottom_id: selectedPieces.bottom!.id,
          bottom_name: selectedPieces.bottom!.name,
          shoes_id: selectedPieces.shoes!.id,
          shoes_name: selectedPieces.shoes!.name,
        },
        occasion: occasion.trim(),
        images: {
          top_url: selectedPieces.top!.image_url,
          bottom_url: selectedPieces.bottom!.image_url,
          shoes_url: selectedPieces.shoes!.image_url,
        }
      }

      console.log("📤 Enviando para avaliação:", payload)

      // Call N8N webhook for look evaluation
      const response = await fetch('https://amiguei.app.n8n.cloud/webhook/look-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("✅ Resultado da avaliação:", result)

      // Check if response has the expected structure
      if (result.success && result.evaluation) {
        setEvaluation({
          score: result.evaluation.score,
          feedback: result.evaluation.feedback,
          positive: result.evaluation.positive || [],
          improvements: result.evaluation.improvements || [],
          suggestions: result.evaluation.suggestions || []
        })
      } else {
        throw new Error('Resposta inválida do servidor')
      }

    } catch (err: any) {
      console.error("❌ Erro ao avaliar look:", err)
      alert(err.message || 'Erro ao avaliar look. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setSelectedPieces({ top: null, bottom: null, shoes: null })
    setOccasion("")
    setSearchTop("")
    setSearchBottom("")
    setSearchShoes("")
    setEvaluation(null)
    setUserRating(0)
  }

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-500"
    if (rating >= 6) return "bg-pink-500"
    return "bg-orange-500"
  }

  // Get emoji based on score
  const getScoreEmoji = (score: number) => {
    if (score >= 9) return "😍"
    if (score >= 8) return "😊"
    if (score >= 6) return "😐"
    if (score >= 4) return "😕"
    return "😞"
  }

  // Modal de coins insuficientes
  if (showInsufficientCoinsModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <AmigueiCoin size="xlarge" />
                <AlertCircle className="absolute -bottom-1 -right-1 w-8 h-8 text-red-500 bg-white rounded-full p-1" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ops! Você precisa de mais coins
            </h2>
            <p className="text-gray-600 mb-4">
              Você tem <span className="font-bold text-pink-600">{balance} {balance === 1 ? 'coin' : 'coins'}</span> e precisa de <span className="font-bold">1 coin</span> para avaliar um look.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setShowInsufficientCoinsModal(false)
                setShowCoinStore(true)
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              Comprar Amiguei.Coins
            </button>
            <button
              onClick={() => setShowInsufficientCoinsModal(false)}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Voltar
            </button>
          </div>
        </div>

        {/* Coin Store Modal */}
        <CoinStore
          open={showCoinStore}
          onClose={() => {
            setShowCoinStore(false)
            refreshBalance()
            setShowInsufficientCoinsModal(false)
          }}
        />
      </div>
    )
  }

  // Loading state (fetching closet)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando seu closet...</p>
        </div>
      </div>
    )
  }

  // Loading state (evaluating look)
  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-8 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl">👗</div>
            </div>
          </div>
          <h2 className="text-3xl font-serif font-bold mb-3 text-gray-800">Analisando seu look...</h2>
          <p className="text-gray-600 text-lg mb-6">Nossa IA está avaliando suas escolhas</p>
          <div className="flex gap-4 justify-center mb-4">
            {selectedPieces.top && (
              <img
                src={selectedPieces.top.image_url}
                alt={selectedPieces.top.name}
                className="w-16 h-16 object-cover rounded-lg shadow-md opacity-75"
              />
            )}
            {selectedPieces.bottom && (
              <img
                src={selectedPieces.bottom.image_url}
                alt={selectedPieces.bottom.name}
                className="w-16 h-16 object-cover rounded-lg shadow-md opacity-75"
              />
            )}
            {selectedPieces.shoes && (
              <img
                src={selectedPieces.shoes.image_url}
                alt={selectedPieces.shoes.name}
                className="w-16 h-16 object-cover rounded-lg shadow-md opacity-75"
              />
            )}
          </div>
          <p className="text-sm text-gray-500">Isso pode levar alguns segundos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 h-[60px] flex items-center px-6">
        <div className="w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-black hover:text-pink-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </Link>
          <div className="max-w-[150px]">
            <Logo />
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 px-4 pt-8 pb-8">
        <div className="container mx-auto max-w-3xl">
          {!evaluation ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold mb-2">Avaliação do Look</h1>
                <p className="text-gray-600">Selecione as peças do seu closet e descreva a ocasião</p>
              </div>

              {/* Empty state */}
              {closetItems.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <Shirt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Seu closet está vazio</h3>
                  <p className="text-gray-600 mb-6">
                    Você precisa adicionar peças ao seu closet antes de avaliar um look.
                  </p>
                  <Link href="/closet">
                    <button className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors">
                      Ir para o Closet
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                  {/* Top selection */}
                  <div className="space-y-2 relative">
                    <label className="block text-base font-medium">
                      Parte de cima <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar blusa, camisa, camiseta..."
                        value={searchTop}
                        onChange={(e) => setSearchTop(e.target.value)}
                        onFocus={() => setFocusedField('top')}
                        onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      {(focusedField === 'top' || searchTop.length > 0) && topItems.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {topItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleSelectPiece("top", item)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-pink-50 transition-colors text-left border-b last:border-b-0"
                            >
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {(focusedField === 'top' || searchTop.length > 0) && topItems.length === 0 && debouncedSearchTop && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                          Nenhuma peça encontrada
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom selection */}
                  <div className="space-y-2 relative">
                    <label className="block text-base font-medium">
                      Parte de baixo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar calça, saia, short..."
                        value={searchBottom}
                        onChange={(e) => setSearchBottom(e.target.value)}
                        onFocus={() => setFocusedField('bottom')}
                        onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      {(focusedField === 'bottom' || searchBottom.length > 0) && bottomItems.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {bottomItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleSelectPiece("bottom", item)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-pink-50 transition-colors text-left border-b last:border-b-0"
                            >
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {(focusedField === 'bottom' || searchBottom.length > 0) && bottomItems.length === 0 && debouncedSearchBottom && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                          Nenhuma peça encontrada
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shoes selection */}
                  <div className="space-y-2 relative">
                    <label className="block text-base font-medium">
                      Tênis ou calçado <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar tênis, sapato, sandália..."
                        value={searchShoes}
                        onChange={(e) => setSearchShoes(e.target.value)}
                        onFocus={() => setFocusedField('shoes')}
                        onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      {(focusedField === 'shoes' || searchShoes.length > 0) && shoesItems.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {shoesItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleSelectPiece("shoes", item)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-pink-50 transition-colors text-left border-b last:border-b-0"
                            >
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {(focusedField === 'shoes' || searchShoes.length > 0) && shoesItems.length === 0 && debouncedSearchShoes && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                          Nenhuma peça encontrada
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected pieces */}
                  {selectedCount > 0 && (
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
                      <p className="text-sm font-medium mb-3">
                        Peças selecionadas ({selectedCount}/3):
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {selectedPieces.top && (
                          <div className="relative bg-white rounded-lg p-2 border-2 border-pink-500 shadow-sm">
                            <button
                              onClick={() => handleRemovePiece("top")}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                              title="Remover peça"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <img
                              src={selectedPieces.top.image_url}
                              alt={selectedPieces.top.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                            <p className="text-xs mt-1 text-center font-medium">{selectedPieces.top.name}</p>
                          </div>
                        )}
                        {selectedPieces.bottom && (
                          <div className="relative bg-white rounded-lg p-2 border-2 border-pink-500 shadow-sm">
                            <button
                              onClick={() => handleRemovePiece("bottom")}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                              title="Remover peça"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <img
                              src={selectedPieces.bottom.image_url}
                              alt={selectedPieces.bottom.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                            <p className="text-xs mt-1 text-center font-medium">{selectedPieces.bottom.name}</p>
                          </div>
                        )}
                        {selectedPieces.shoes && (
                          <div className="relative bg-white rounded-lg p-2 border-2 border-pink-500 shadow-sm">
                            <button
                              onClick={() => handleRemovePiece("shoes")}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                              title="Remover peça"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <img
                              src={selectedPieces.shoes.image_url}
                              alt={selectedPieces.shoes.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                            <p className="text-xs mt-1 text-center font-medium">{selectedPieces.shoes.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Occasion textarea */}
                  <div className="space-y-2">
                    <label className="block text-base font-medium">
                      Descreva a ocasião <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Ex: Estou indo para o shopping com minha amiga para fazermos compras e almoçar lá"
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      rows={4}
                      className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500">
                      {occasion.length > 0 ? `${occasion.length} caracteres` : "Descreva onde e quando você vai usar este look"}
                    </p>
                  </div>

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit() || submitting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl text-lg font-medium hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar para avaliação"
                    )}
                  </button>

                  {!canSubmit() && selectedCount > 0 && (
                    <p className="text-sm text-center text-gray-500">
                      {selectedCount < 3 && "Selecione as 3 peças necessárias "}
                      {selectedCount === 3 && occasion.trim().length === 0 && "Descreva a ocasião para continuar"}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            // Evaluation result
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-4xl font-serif font-bold mb-2">Seu Look</h1>
                <p className="text-gray-600">Avaliação completa do Amiguei.AI</p>
              </div>

              {/* Look display with score */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
                {/* Selected pieces */}
                <div className="flex gap-6 justify-center mb-8 flex-wrap">
                  {selectedPieces.top && (
                    <div className="text-center">
                      <img
                        src={selectedPieces.top.image_url}
                        alt={selectedPieces.top.name}
                        className="w-28 h-28 object-contain mb-2 mx-auto"
                      />
                      <p className="text-sm font-medium text-gray-700">{selectedPieces.top.name}</p>
                      <p className="text-xs text-gray-500">{selectedPieces.top.category}</p>
                    </div>
                  )}
                  {selectedPieces.bottom && (
                    <div className="text-center">
                      <img
                        src={selectedPieces.bottom.image_url}
                        alt={selectedPieces.bottom.name}
                        className="w-28 h-28 object-contain mb-2 mx-auto"
                      />
                      <p className="text-sm font-medium text-gray-700">{selectedPieces.bottom.name}</p>
                      <p className="text-xs text-gray-500">{selectedPieces.bottom.category}</p>
                    </div>
                  )}
                  {selectedPieces.shoes && (
                    <div className="text-center">
                      <img
                        src={selectedPieces.shoes.image_url}
                        alt={selectedPieces.shoes.name}
                        className="w-28 h-28 object-contain mb-2 mx-auto"
                      />
                      <p className="text-sm font-medium text-gray-700">{selectedPieces.shoes.name}</p>
                      <p className="text-xs text-gray-500">{selectedPieces.shoes.category}</p>
                    </div>
                  )}
                </div>

                {/* Score circle */}
                <div className="flex justify-center mb-6">
                  <div className={`w-40 h-40 rounded-full flex items-center justify-center border-8 ${
                    evaluation.score >= 8 ? 'border-green-500 bg-green-50' :
                    evaluation.score >= 5 ? 'border-pink-500 bg-pink-50' :
                    'border-orange-500 bg-orange-50'
                  } shadow-2xl`}>
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${
                        evaluation.score >= 8 ? 'text-green-600' :
                        evaluation.score >= 5 ? 'text-pink-600' :
                        'text-orange-600'
                      }`}>
                        {evaluation.score}
                      </div>
                      <div className={`text-lg font-medium ${
                        evaluation.score >= 8 ? 'text-green-600' :
                        evaluation.score >= 5 ? 'text-pink-600' :
                        'text-orange-600'
                      }`}>
                        /10
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emoji and title */}
                <div className="text-center mb-6">
                  <div className="text-6xl mb-3">{getScoreEmoji(evaluation.score)}</div>
                  <h3 className="text-2xl font-bold text-pink-600 mb-2">Nota do Amiguei.AI</h3>
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-pink-600 mb-4">Avaliação Detalhada</h2>

                {/* Main feedback */}
                <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-5 mb-6">
                  <p className="text-gray-800 leading-relaxed text-justify">{evaluation.feedback}</p>
                </div>

                {/* Positive points */}
                {evaluation.positive && evaluation.positive.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-green-600 mb-3 flex items-center gap-2 text-lg">
                      <span className="text-2xl">✓</span> Pontos Positivos
                    </h3>
                    <div className="space-y-2">
                      {evaluation.positive.map((point, index) => (
                        <div key={index} className="flex gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                          <span className="text-green-500 font-bold">•</span>
                          <p className="text-gray-700 flex-1">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {evaluation.improvements && evaluation.improvements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-orange-600 mb-3 flex items-center gap-2 text-lg">
                      <span className="text-2xl">⚡</span> Pontos de Melhoria
                    </h3>
                    <div className="space-y-2">
                      {evaluation.improvements.map((improvement, index) => (
                        <div key={index} className="flex gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <span className="text-orange-500 font-bold">•</span>
                          <p className="text-gray-700 flex-1">{improvement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                  <div>
                    <h3 className="font-bold text-blue-600 mb-3 flex items-center gap-2 text-lg">
                      <span className="text-2xl">💡</span> Sugestões
                    </h3>
                    <div className="space-y-2">
                      {evaluation.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <span className="text-blue-500 font-bold">•</span>
                          <p className="text-gray-700 flex-1">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User rating */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-medium mb-4 text-center">
                  Como você avalia essa opinião do Amiguei.AI?
                </h3>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          star <= (hoveredStar || userRating)
                            ? "fill-pink-500 text-pink-500"
                            : "fill-none text-gray-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <p className="text-sm text-gray-600 text-center mt-3">
                    Obrigado pelo feedback! Isso nos ajuda a melhorar.
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 flex-col sm:flex-row">
                <button
                  onClick={handleReset}
                  className="flex-1 px-8 py-4 border-2 border-pink-500 text-pink-500 rounded-xl font-semibold hover:bg-pink-50 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Avaliar outro look
                </button>
                <Link href="/" className="flex-1">
                  <button className="w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                    Voltar ao início
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
