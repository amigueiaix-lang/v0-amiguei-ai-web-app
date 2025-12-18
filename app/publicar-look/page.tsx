"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { supabase } from "@/lib/supabase"
import type { ClosetItem, SelectedPieces } from "@/types/evaluation"
import { CATEGORY_MAPPING } from "@/types/evaluation"
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

export default function PublicarLookPage() {
  const router = useRouter()

  // State
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPieces, setSelectedPieces] = useState<SelectedPieces>({
    top: null,
    bottom: null,
    dress: null,
    shoes: null
  })
  const [occasion, setOccasion] = useState("")
  const [searchTop, setSearchTop] = useState("")
  const [searchBottom, setSearchBottom] = useState("")
  const [searchDress, setSearchDress] = useState("")
  const [searchShoes, setSearchShoes] = useState("")
  const [focusedField, setFocusedField] = useState<'top' | 'bottom' | 'dress' | 'shoes' | null>(null)

  // Debounced search values
  const debouncedSearchTop = useDebounce(searchTop, 300)
  const debouncedSearchBottom = useDebounce(searchBottom, 300)
  const debouncedSearchDress = useDebounce(searchDress, 300)
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
  const dressItems = filterItems(CATEGORY_MAPPING.dress as unknown as string[], debouncedSearchDress)
  const shoesItems = filterItems(CATEGORY_MAPPING.shoes as unknown as string[], debouncedSearchShoes)

  // Handle piece selection
  const handleSelectPiece = (type: keyof SelectedPieces, item: ClosetItem) => {
    // Se selecionar vestido, limpar top e bottom
    if (type === "dress") {
      setSelectedPieces(prev => ({
        ...prev,
        dress: item,
        top: null,
        bottom: null
      }))
      setSearchDress("")
      setSearchTop("")
      setSearchBottom("")
      setFocusedField(null)
    }
    // Se selecionar top ou bottom, limpar vestido
    else if (type === "top" || type === "bottom") {
      setSelectedPieces(prev => ({
        ...prev,
        [type]: item,
        dress: null
      }))
      if (type === "top") {
        setSearchTop("")
        setSearchDress("")
      } else {
        setSearchBottom("")
        setSearchDress("")
      }
      setFocusedField(null)
    }
    // Shoes não afeta outros campos
    else {
      setSelectedPieces(prev => ({
        ...prev,
        [type]: item
      }))
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
    else if (type === "dress") setSearchDress("")
    else setSearchShoes("")
  }

  // Validation
  const isDressLook = selectedPieces.dress !== null
  const isTraditionalLook = selectedPieces.top !== null && selectedPieces.bottom !== null
  const selectedCount = [
    selectedPieces.dress,
    selectedPieces.top,
    selectedPieces.bottom,
    selectedPieces.shoes
  ].filter(Boolean).length

  // Total de peças esperadas (2 para dress, 3 para traditional)
  const expectedCount = isDressLook ? 2 : 3

  const canSubmit = () => {
    const hasValidPieces = isDressLook
      ? (selectedPieces.dress !== null && selectedPieces.shoes !== null)
      : (selectedPieces.top !== null && selectedPieces.bottom !== null && selectedPieces.shoes !== null)

    return hasValidPieces && occasion.trim().length > 0
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
        toast.error("❌ Você precisa estar logado para publicar um look")
        return
      }

      // Aqui seria a chamada para a API de publicar look
      // Por enquanto, apenas simular sucesso
      console.log("📤 Publicando look:", {
        user_id: user.id,
        pieces: selectedPieces,
        occasion: occasion.trim()
      })

      // Simular delay de publicação
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success("✅ Look publicado com sucesso!")

      // Redirecionar para o feed de amigas
      router.push("/amigos")

    } catch (err: any) {
      console.error("❌ Erro ao publicar look:", err)
      toast.error(err.message || 'Erro ao publicar look. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
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

  // Empty closet state
  if (closetItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Seu closet está vazio!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Para publicar looks, precisamos que você adicione algumas peças ao seu closet virtual primeiro.
            É rápido e fácil!
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/closet")}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#FF69B4] to-[#E91E63] text-white rounded-xl font-semibold hover:brightness-110 transition-all shadow-md"
            >
              Ir para o Closet
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state (publishing look)
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
          <h2 className="text-3xl font-serif font-bold mb-3 text-gray-800">Publicando seu look...</h2>
          <p className="text-gray-600 text-lg mb-6">Suas amigas vão adorar!</p>
          <div className="flex gap-4 justify-center mb-4">
            {selectedPieces.dress && (
              <img
                src={selectedPieces.dress.image_url}
                alt={selectedPieces.dress.name}
                className="w-16 h-16 object-cover rounded-lg shadow-md opacity-75"
              />
            )}
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
      <Header showBackButton backButtonHref="/amigos" backButtonText="Voltar" />

      <main className="flex-1 px-4 pt-20 pb-8">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Publicar Look</h1>
            <p className="text-gray-600">Selecione as peças do seu closet e descreva a ocasião</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
              {/* Info sobre dress OU top+bottom */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  💡 <strong>Escolha:</strong> Selecione <strong>vestido</strong> OU <strong>parte de cima + parte de baixo</strong>
                </p>
              </div>

              {/* Dress selection (opcional - substitui top + bottom) */}
              <div className="space-y-2 relative">
                <label className="block text-base font-medium">
                  Vestido <span className="text-gray-400">(substitui top + bottom)</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar vestido..."
                    value={searchDress}
                    onChange={(e) => setSearchDress(e.target.value)}
                    onFocus={() => setFocusedField('dress')}
                    onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                    disabled={isTraditionalLook}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {(focusedField === 'dress' || searchDress.length > 0) && dressItems.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {dressItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectPiece("dress", item)}
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
                  {(focusedField === 'dress' || searchDress.length > 0) && dressItems.length === 0 && debouncedSearchDress && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                      Nenhum vestido encontrado
                    </div>
                  )}
                </div>
              </div>

              {/* Divisor "OU" */}
              {!isDressLook && !isTraditionalLook && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">OU</span>
                  </div>
                </div>
              )}

              {/* Top selection */}
              <div className="space-y-2 relative">
                <label className="block text-base font-medium">
                  Parte de cima <span className={isDressLook ? "text-gray-400" : "text-red-500"}>*</span>
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
                    disabled={isDressLook}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  Parte de baixo <span className={isDressLook ? "text-gray-400" : "text-red-500"}>*</span>
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
                    disabled={isDressLook}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    Peças selecionadas ({selectedCount}/{expectedCount}):
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {selectedPieces.dress && (
                      <div className="relative bg-white rounded-lg p-2 border-2 border-pink-500 shadow-sm">
                        <button
                          onClick={() => handleRemovePiece("dress")}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          title="Remover peça"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <img
                          src={selectedPieces.dress.image_url}
                          alt={selectedPieces.dress.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <p className="text-xs mt-1 text-center font-medium">{selectedPieces.dress.name}</p>
                      </div>
                    )}
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
                    Publicando...
                  </>
                ) : (
                  "Publicar"
                )}
              </button>

              {!canSubmit() && selectedCount > 0 && (
                <p className="text-sm text-center text-gray-500">
                  {selectedCount < expectedCount && "Selecione vestido + sapatos OU top + bottom + sapatos"}
                  {selectedCount === expectedCount && occasion.trim().length === 0 && "Descreva a ocasião para continuar"}
                </p>
              )}
            </div>
        </div>
      </main>
    </div>
  )
}
