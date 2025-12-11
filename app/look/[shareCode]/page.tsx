"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, Heart, Share2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface ClotItem {
  id: string
  name: string
  image_url: string
  category: string
  color: string
}

interface SharedLook {
  id: string
  share_code: string
  top_item?: ClotItem | null
  bottom_item?: ClotItem | null
  dress_item?: ClotItem | null
  shoes_item: ClotItem
  reasoning: string
  occasion: string | null
  style: string | null
  climate: string | null
  view_count: number
  created_at: string
  user: {
    id: string
    name: string
    username: string | null
  }
}

export default function SharedLookPage() {
  const params = useParams()
  const router = useRouter()
  const shareCode = params.shareCode as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharedLook, setSharedLook] = useState<SharedLook | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  useEffect(() => {
    if (shareCode) {
      fetchSharedLook()
    }
  }, [shareCode])

  const fetchSharedLook = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/share-look?code=${shareCode}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar look')
      }

      setSharedLook(data.shared_look)
    } catch (err: any) {
      console.error('Erro ao buscar look:', err)
      setError(err.message || 'Erro ao carregar look compartilhado')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!sharedLook) return

    try {
      setIsSharing(true)
      const shareUrl = window.location.href

      if (navigator.share) {
        await navigator.share({
          title: `Look criado por ${sharedLook.user.name} - Amiguei.AI`,
          text: `Confira este look incrível criado com Amiguei.AI! 👗✨`,
          url: shareUrl,
        })
        toast.success('Look compartilhado! 🎉')
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copiado! 📋')
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err)
        toast.error('Erro ao compartilhar')
      }
    } finally {
      setIsSharing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Carregando look...</h2>
        </div>
      </div>
    )
  }

  if (error || !sharedLook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Look não encontrado</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Este link pode estar incorreto ou o look pode ter sido removido.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#FF69B4] to-[#E91E63] text-white rounded-xl font-semibold hover:brightness-110 transition-all shadow-md"
          >
            Criar meu próprio look
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir para Amiguei.AI
          </button>

          <button
            onClick={handleShare}
            disabled={isSharing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          {/* User Info */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Look Compartilhado</h1>
            <p className="text-gray-600">
              Criado por <span className="font-semibold text-pink-600">{sharedLook.user.name}</span>
            </p>
            {sharedLook.occasion && (
              <p className="text-sm text-gray-500 mt-1">
                Para ocasião: <span className="font-medium">{sharedLook.occasion}</span>
              </p>
            )}
          </div>

          {/* Look Items */}
          <div className="max-w-[400px] mx-auto mb-8">
            <div className="flex flex-col items-center">
              {sharedLook.dress_item ? (
                // LOOK COM VESTIDO: mostrar apenas vestido + sapatos
                <>
                  {/* VESTIDO */}
                  <div className="text-center w-full relative z-30">
                    <div className="max-w-[300px] mx-auto h-[450px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {sharedLook.dress_item.image_url && (
                        <Image
                          src={sharedLook.dress_item.image_url}
                          alt={sharedLook.dress_item.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="mt-3 mb-2">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Vestido</p>
                      <p className="font-bold">{sharedLook.dress_item.name}</p>
                    </div>
                  </div>

                  {/* SAPATOS - sobrepõe o vestido */}
                  <div className="text-center w-full relative z-20 -mt-8">
                    <div className="max-w-[300px] mx-auto h-[200px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {sharedLook.shoes_item.image_url && (
                        <Image
                          src={sharedLook.shoes_item.image_url}
                          alt={sharedLook.shoes_item.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Shoes</p>
                      <p className="font-bold">{sharedLook.shoes_item.name}</p>
                    </div>
                  </div>
                </>
              ) : (
                // LOOK TRADICIONAL: mostrar top + bottom + shoes
                <>
                  {/* TOP */}
                  <div className="text-center w-full relative z-30">
                    <div className="max-w-[300px] mx-auto h-[280px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {sharedLook.top_item?.image_url && (
                        <Image
                          src={sharedLook.top_item.image_url}
                          alt={sharedLook.top_item.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="mt-3 mb-2">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Top</p>
                      <p className="font-bold">{sharedLook.top_item?.name}</p>
                    </div>
                  </div>

                  {/* BOTTOM */}
                  <div className="text-center w-full relative z-20 -mt-8">
                    <div className="max-w-[300px] mx-auto h-[320px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {sharedLook.bottom_item?.image_url && (
                        <Image
                          src={sharedLook.bottom_item.image_url}
                          alt={sharedLook.bottom_item.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="mt-3 mb-2">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Bottom</p>
                      <p className="font-bold">{sharedLook.bottom_item?.name}</p>
                    </div>
                  </div>

                  {/* SHOES */}
                  <div className="text-center w-full relative z-10 -mt-8">
                    <div className="max-w-[300px] mx-auto h-[200px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {sharedLook.shoes_item.image_url && (
                        <Image
                          src={sharedLook.shoes_item.image_url}
                          alt={sharedLook.shoes_item.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Shoes</p>
                      <p className="font-bold">{sharedLook.shoes_item.name}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-xl mb-3 text-pink-600">Por que esse look?</h3>
            <p className="text-gray-700 leading-relaxed">{sharedLook.reasoning}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{sharedLook.view_count} visualizações</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-300 rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">
            Gostou deste look? 💝
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            Crie seus próprios looks personalizados com inteligência artificial no Amiguei.AI!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/signup')}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:brightness-110 transition-all shadow-lg"
            >
              Criar conta grátis
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 border-2 border-pink-500 text-pink-600 rounded-xl font-semibold hover:bg-pink-50 transition-all"
            >
              Já tenho conta
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            ✨ Organize seu closet • 🎨 Receba sugestões de looks • 👗 Avalie suas combinações
          </p>
        </div>
      </div>
    </div>
  )
}
