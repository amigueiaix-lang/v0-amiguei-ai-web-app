"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, X, Star } from "lucide-react"
import { Logo } from "@/components/logo"

interface ClothingItem {
  id: string
  name: string
  category: string
  imageUrl: string
}

interface SelectedPieces {
  top?: ClothingItem
  bottom?: ClothingItem
  shoes?: ClothingItem
}

interface EvaluationResult {
  rating: number
  comment: string
}

export default function AvaliacaoPage() {
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([])
  const [selectedPieces, setSelectedPieces] = useState<SelectedPieces>({})
  const [occasion, setOccasion] = useState("")
  const [searchTop, setSearchTop] = useState("")
  const [searchBottom, setSearchBottom] = useState("")
  const [searchShoes, setSearchShoes] = useState("")
  const [showTopDropdown, setShowTopDropdown] = useState(false)
  const [showBottomDropdown, setShowBottomDropdown] = useState(false)
  const [showShoesDropdown, setShowShoesDropdown] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [userRating, setUserRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem("amiguei-closet")
    if (stored) {
      setClosetItems(JSON.parse(stored))
    }
  }, [])

  const topItems = closetItems.filter(
    (item) =>
      ["Camiseta", "Blusa", "Camisa", "Jaqueta", "Casaco"].includes(item.category) &&
      item.name.toLowerCase().includes(searchTop.toLowerCase()),
  )

  const bottomItems = closetItems.filter(
    (item) =>
      ["Calça", "Short", "Saia", "Vestido"].includes(item.category) &&
      item.name.toLowerCase().includes(searchBottom.toLowerCase()),
  )

  const shoesItems = closetItems.filter(
    (item) =>
      ["Sapato", "Tênis", "Sandália"].includes(item.category) &&
      item.name.toLowerCase().includes(searchShoes.toLowerCase()),
  )

  const handleSelectPiece = (type: "top" | "bottom" | "shoes", item: ClothingItem) => {
    setSelectedPieces({ ...selectedPieces, [type]: item })
    if (type === "top") {
      setSearchTop(item.name)
      setShowTopDropdown(false)
    } else if (type === "bottom") {
      setSearchBottom(item.name)
      setShowBottomDropdown(false)
    } else {
      setSearchShoes(item.name)
      setShowShoesDropdown(false)
    }
  }

  const handleRemovePiece = (type: "top" | "bottom" | "shoes") => {
    const updated = { ...selectedPieces }
    delete updated[type]
    setSelectedPieces(updated)
    if (type === "top") setSearchTop("")
    else if (type === "bottom") setSearchBottom("")
    else setSearchShoes("")
  }

  const selectedCount = Object.keys(selectedPieces).length
  const isFormValid = selectedCount >= 2 && occasion.trim().length > 0

  const handleSubmit = () => {
    if (!isFormValid) return

    const mockRating = Math.floor(Math.random() * 3) + 7 // Random 7-9
    const mockComment = `Para a ocasião "${occasion}", seu look ficou coerente e confortável. As peças escolhidas combinam bem entre si e são adequadas para o contexto. ${
      selectedPieces.top ? `A ${selectedPieces.top.name} traz um toque elegante.` : ""
    } ${selectedPieces.bottom ? `A ${selectedPieces.bottom.name} complementa perfeitamente.` : ""} ${
      selectedPieces.shoes ? `O ${selectedPieces.shoes.name} finaliza o look com estilo.` : ""
    } Continue explorando combinações que reflitam sua personalidade!`

    setEvaluation({
      rating: mockRating,
      comment: mockComment,
    })
  }

  const handleReset = () => {
    setSelectedPieces({})
    setOccasion("")
    setSearchTop("")
    setSearchBottom("")
    setSearchShoes("")
    setEvaluation(null)
    setUserRating(0)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-500"
    if (rating >= 6) return "bg-[#FF69B4]"
    return "bg-orange-500"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 h-[60px] flex items-center px-6">
        <div className="w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-black hover:text-[#FF69B4] transition-colors">
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

              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                <div className="space-y-2 relative">
                  <label className="block text-base font-medium">Parte de cima</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="🔍 Buscar blusa, camisa, camiseta..."
                      value={searchTop}
                      onChange={(e) => {
                        setSearchTop(e.target.value)
                        setShowTopDropdown(true)
                      }}
                      onFocus={() => setShowTopDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
                    />
                    {showTopDropdown && topItems.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {topItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelectPiece("top", item)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
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
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-base font-medium">Parte de baixo</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="🔍 Buscar calça, saia, short..."
                      value={searchBottom}
                      onChange={(e) => {
                        setSearchBottom(e.target.value)
                        setShowBottomDropdown(true)
                      }}
                      onFocus={() => setShowBottomDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
                    />
                    {showBottomDropdown && bottomItems.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {bottomItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelectPiece("bottom", item)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
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
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-base font-medium">Tênis ou calçado</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="🔍 Buscar tênis, sapato, sandália..."
                      value={searchShoes}
                      onChange={(e) => {
                        setSearchShoes(e.target.value)
                        setShowShoesDropdown(true)
                      }}
                      onFocus={() => setShowShoesDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
                    />
                    {showShoesDropdown && shoesItems.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {shoesItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelectPiece("shoes", item)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
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
                  </div>
                </div>

                {selectedCount > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium mb-3">Peças selecionadas:</p>
                    <div className="flex gap-3 flex-wrap">
                      {selectedPieces.top && (
                        <div className="relative bg-white rounded-lg p-2 border border-gray-200">
                          <button
                            onClick={() => handleRemovePiece("top")}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <img
                            src={selectedPieces.top.imageUrl || "/placeholder.svg"}
                            alt={selectedPieces.top.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <p className="text-xs mt-1 text-center">{selectedPieces.top.name}</p>
                        </div>
                      )}
                      {selectedPieces.bottom && (
                        <div className="relative bg-white rounded-lg p-2 border border-gray-200">
                          <button
                            onClick={() => handleRemovePiece("bottom")}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <img
                            src={selectedPieces.bottom.imageUrl || "/placeholder.svg"}
                            alt={selectedPieces.bottom.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <p className="text-xs mt-1 text-center">{selectedPieces.bottom.name}</p>
                        </div>
                      )}
                      {selectedPieces.shoes && (
                        <div className="relative bg-white rounded-lg p-2 border border-gray-200">
                          <button
                            onClick={() => handleRemovePiece("shoes")}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <img
                            src={selectedPieces.shoes.imageUrl || "/placeholder.svg"}
                            alt={selectedPieces.shoes.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <p className="text-xs mt-1 text-center">{selectedPieces.shoes.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-base font-medium">Descreva a ocasião</label>
                  <textarea
                    placeholder="Ex: Estou indo para o shopping com minha amiga para fazermos compras e almoçar lá"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    rows={4}
                    className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#FF69B4] to-[#E91E63] text-white rounded-xl text-lg font-medium hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all"
                >
                  Enviar para avaliação
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="font-semibold mb-4">Seu Look</h2>
                <div className="flex gap-4 justify-center">
                  {selectedPieces.top && (
                    <div className="text-center">
                      <img
                        src={selectedPieces.top.imageUrl || "/placeholder.svg"}
                        alt={selectedPieces.top.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <p className="text-xs mt-2">{selectedPieces.top.name}</p>
                    </div>
                  )}
                  {selectedPieces.bottom && (
                    <div className="text-center">
                      <img
                        src={selectedPieces.bottom.imageUrl || "/placeholder.svg"}
                        alt={selectedPieces.bottom.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <p className="text-xs mt-2">{selectedPieces.bottom.name}</p>
                    </div>
                  )}
                  {selectedPieces.shoes && (
                    <div className="text-center">
                      <img
                        src={selectedPieces.shoes.imageUrl || "/placeholder.svg"}
                        alt={selectedPieces.shoes.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <p className="text-xs mt-2">{selectedPieces.shoes.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div
                  className={`w-32 h-32 mx-auto rounded-full ${getRatingColor(evaluation.rating)} flex items-center justify-center mb-4`}
                >
                  <span className="text-6xl font-bold text-white">{evaluation.rating}</span>
                  <span className="text-2xl font-bold text-white">/10</span>
                </div>
                <p className="text-gray-600">Nota do Amiguei.AI</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl text-[#FF69B4] font-semibold mb-4">Avaliação do Amiguei.AI</h2>
                <p className="text-black leading-relaxed text-justify">{evaluation.comment}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-medium mb-4">Como você avalia essa opinião do Amiguei.AI?</h3>
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
                            ? "fill-[#FF69B4] text-[#FF69B4]"
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

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 border-2 border-black rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Avaliar outro look
                </button>
                <Link href="/" className="flex-1">
                  <button className="w-full px-6 py-3 bg-[#FF69B4] text-white rounded-lg font-medium hover:bg-[#FF1493] transition-colors">
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
