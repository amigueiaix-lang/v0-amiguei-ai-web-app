"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
// TODO: Reativar RefreshCw quando implementar substituição individual no N8N
import { Loader2, ArrowLeft, Share2, Check } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

// Interface para a resposta REAL do N8N
interface LookResponse {
  success: boolean
  message: string
  top_item_id?: string
  top_item_name?: string
  bottom_item_id?: string
  bottom_item_name?: string
  dress_item_id?: string
  dress_item_name?: string
  shoes_item_id: string
  shoes_item_name: string
  reasoning: string
}

// Interface para o look processado (depois de buscar no Supabase)
interface ProcessedLook {
  top?: { id: string; name: string; image_url: string }
  bottom?: { id: string; name: string; image_url: string }
  dress?: { id: string; name: string; image_url: string }
  shoes: { id: string; name: string; image_url: string }
  reasoning: string
}

export default function ResultadoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [look, setLook] = useState<ProcessedLook | null>(null)
  const [lookImages, setLookImages] = useState<{
    top: string | null
    bottom: string | null
    dress: string | null
    shoes: string | null
  }>({ top: null, bottom: null, dress: null, shoes: null })
  // TODO: Reativar quando implementar substituição individual no N8N
  // const [refreshingItem, setRefreshingItem] = useState<'top' | 'bottom' | 'shoes' | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null)

  useEffect(() => {
    generateLook()
  }, [])

  const generateLook = async (feedback?: string | null) => {
    try {
      setLoading(true)
      setError(null)

      // Pegar usuário logado
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Você precisa estar logado para gerar looks!")
        return
      }

      const answersJson = localStorage.getItem("amiguei-quiz-answers")
      if (!answersJson) {
        setError("Respostas do quiz não encontradas")
        return
      }

      const answers = JSON.parse(answersJson)
      const quizResponses = {
        occasion: answers[0]?.toLowerCase() || "casual",
        climate: answers[1]?.toLowerCase() || "ameno",
        style: answers[2]?.toLowerCase() || "confortável",
        preferred_colors: answers[3] || "sem preferência",
        extra_info: answers[4] || "",
      }

      // Se houver feedback e um look atual, salvar o feedback antes de gerar novo look
      if (feedback && look) {
        try {
          const feedbackPayload: any = {
            user_id: user.id,
            feedback_type: feedback,
            occasion: quizResponses.occasion,
            climate: quizResponses.climate,
            style: quizResponses.style,
          }

          // Add item IDs based on look type
          if (look.dress) {
            feedbackPayload.dress_item_id = look.dress.id
          } else {
            feedbackPayload.top_item_id = look.top?.id
            feedbackPayload.bottom_item_id = look.bottom?.id
          }
          feedbackPayload.shoes_item_id = look.shoes.id

          await fetch('/api/look-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackPayload),
          })
        } catch (err) {
          console.error('Erro ao salvar feedback:', err)
          // Continuar mesmo se falhar ao salvar feedback
        }
      }

      const payload: any = {
        user_id: user.id,
        quiz_responses: quizResponses,
      }

      // Adicionar feedback ao payload se fornecido
      if (feedback && look) {
        payload.user_feedback = feedback
        // Enviar IDs das peças anteriores para a IA evitar
        payload.previous_look = {
          shoes_item_id: look.shoes.id
        }

        // Add dress or top+bottom to previous_look
        if (look.dress) {
          payload.previous_look.dress_item_id = look.dress.id
        } else {
          payload.previous_look.top_item_id = look.top?.id
          payload.previous_look.bottom_item_id = look.bottom?.id
        }
      }

      console.log("🚀 [1/5] Iniciando requisição para N8N...")
      console.log("📦 [2/5] Payload completo:", JSON.stringify(payload, null, 2))
      console.log("🌐 [3/5] URL:", "https://amiguei.app.n8n.cloud/webhook/outfit-generator")

      const response = await fetch("https://amiguei.app.n8n.cloud/webhook/outfit-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("✅ [4/5] Resposta recebida!")
      console.log("📡 Status:", response.status, response.statusText)
      console.log("📄 Headers:", {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        server: response.headers.get('server'),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Erro do N8N:", errorText)
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }

      const responseText = await response.text()
      console.log("📦 [5/5] Response text recebido:", responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''))

      if (!responseText) {
        throw new Error("N8N retornou resposta vazia")
      }

      let rawData = JSON.parse(responseText)
      console.log("✅ [SUCESSO] Data parsed (RAW):", rawData)

      // 🐛 DEBUG: Verificar estrutura completa do look
      console.log("📦 [DEBUG] ========== RESPOSTA COMPLETA DO N8N (RAW) ==========")
      console.log(JSON.stringify(rawData, null, 2))
      console.log("========================================")

      console.log("🎯 [DEBUG] Tipo da resposta:", typeof rawData)
      console.log("📦 [DEBUG] É array?", Array.isArray(rawData))
      console.log("📦 [DEBUG] Length (se array):", Array.isArray(rawData) ? rawData.length : "N/A")

      // ✅ CORREÇÃO: N8N pode retornar ARRAY [{...}] ou OBJETO {...}
      // Se for array, pegar primeiro item
      if (Array.isArray(rawData) && rawData.length > 0) {
        rawData = rawData[0]
        console.log("📦 [DEBUG] Convertido de array para objeto:", rawData)
      }

      const data = rawData

      console.log("🔍 ========== JSON COMPLETO DE data (ROOT) ==========")
      console.log(JSON.stringify(data, null, 2))
      console.log("🔍 ========== FIM JSON ==========")

      console.log("🔍 ============ DEBUGGING ESTRUTURA COMPLETA ============")
      console.log("📦 data completo:", JSON.stringify(data, null, 2))
      console.log("📦 data.look existe?", !!data.look)
      console.log("📦 data.look completo:", JSON.stringify(data.look, null, 2))
      console.log("📦 Tipo de data.look:", typeof data.look)
      console.log("📦 É array?", Array.isArray(data.look))

      // Se data.look for objeto, mostre suas chaves:
      if (data.look && typeof data.look === 'object') {
        console.log("🔑 Chaves dentro de data.look:", Object.keys(data.look))
      }

      // Tentar diferentes acessos:
      console.log("🧪 TESTE 1 - data.look.top_item_id:", data.look?.top_item_id)
      console.log("🧪 TESTE 2 - data.look.top?.id:", data.look?.top?.id)
      console.log("🧪 TESTE 3 - data.look.top?.item_id:", data.look?.top?.item_id)
      console.log("🧪 TESTE 4 - data.top_item_id (root):", data.top_item_id)

      console.log("🔍 ============ FIM DEBUG ============")

      console.log("\n📦 [DEBUG] ========== OBJETO EXTRAÍDO (lookData) ==========")
      console.log("Tipo do data:", typeof data)
      console.log("Keys do data:", Object.keys(data))
      console.log(JSON.stringify(data, null, 2))
      console.log("========================================")

      console.log("\n🔍 [DEBUG] ========== ACESSO DIRETO AOS CAMPOS ==========")
      console.log("🆔 [DEBUG] Estrutura do objeto data:")
      console.log("  data.success:", data.success)
      console.log("  data.message:", data.message)
      console.log("  data.look existe?", "look" in data)

      console.log("\n🆔 [DEBUG] IDs no ROOT de data:")
      console.log("  👕 data.top_item_id:", data.top_item_id)
      console.log("  👕 Tipo:", typeof data.top_item_id)

      console.log("  👖 data.bottom_item_id:", data.bottom_item_id)
      console.log("  👖 Tipo:", typeof data.bottom_item_id)

      console.log("  👟 data.shoes_item_id:", data.shoes_item_id)
      console.log("  👟 Tipo:", typeof data.shoes_item_id)

      console.log("\n📝 [DEBUG] Nomes no ROOT de data:")
      console.log("  👕 data.top_item_name:", data.top_item_name)
      console.log("  👖 data.bottom_item_name:", data.bottom_item_name)
      console.log("  👟 data.shoes_item_name:", data.shoes_item_name)

      console.log("\n📝 [DEBUG] Reasoning:")
      console.log("  data.reasoning:", data.reasoning)

      console.log("\n🔍 [DEBUG] Verificando se success existe:")
      console.log("  'success' in data:", "success" in data)
      console.log("  data.success === true:", data.success === true)
      console.log("  !!data.success:", !!data.success)

      console.log('🔍 ========== JSON COMPLETO (STRINGIFIED) ==========')
      console.log(JSON.stringify(data, null, 2))
      console.log('🔍 ========== FIM ==========')

      // ✅ SUPORTE PARA MÚLTIPLOS FORMATOS COM PRIORIDADE PARA FORMATO PLANO:
      // Formato 1 (plano - PRIORIDADE): { dress_item_id, dress_item_name, shoes_item_id, shoes_item_name }
      // Formato 2 (aninhado): { look: { dress: { id, name }, shoes: { id, name } } }
      // IGNORA campos vazios ("") e null do formato plano e aninhado!

      // Prioriza formato plano e ignora IDs vazios/null (usando trim() para validar)
      const topId = data?.top_item_id?.trim() || data?.look?.top?.id?.trim() || undefined
      const topName = data?.top_item_name?.trim() || data?.look?.top?.name?.trim() || undefined
      const bottomId = data?.bottom_item_id?.trim() || data?.look?.bottom?.id?.trim() || undefined
      const bottomName = data?.bottom_item_name?.trim() || data?.look?.bottom?.name?.trim() || undefined
      const dressId = data?.dress_item_id?.trim() || data?.look?.dress?.id?.trim() || undefined
      const dressName = data?.dress_item_name?.trim() || data?.look?.dress?.name?.trim() || undefined
      const shoesId = data?.shoes_item_id?.trim() || data?.look?.shoes?.id?.trim() || undefined
      const shoesName = data?.shoes_item_name?.trim() || data?.look?.shoes?.name?.trim() || undefined
      const reasoning = data?.reasoning || data?.look?.reasoning

      const isDressLook = !!dressId // Vestido substitui top + bottom

      console.log('🎯 [DEBUG] IDs EXTRAÍDOS (estrutura corrigida):')
      console.log('  👗 dressId:', dressId, '| Tipo:', typeof dressId)
      console.log('  👗 dressName:', dressName)
      console.log('  👕 topId:', topId, '| Tipo:', typeof topId)
      console.log('  👕 topName:', topName)
      console.log('  👖 bottomId:', bottomId, '| Tipo:', typeof bottomId)
      console.log('  👖 bottomName:', bottomName)
      console.log('  👟 shoesId:', shoesId, '| Tipo:', typeof shoesId)
      console.log('  👟 shoesName:', shoesName)
      console.log('  📝 reasoning:', reasoning)
      console.log('  🎯 isDressLook:', isDressLook)

      // Verificar se os IDs são válidos antes de prosseguir
      if (isDressLook) {
        // Look com vestido: precisa de dress + shoes
        if (!dressId || !shoesId) {
          console.error("❌❌❌ IDs INVÁLIDOS PARA LOOK COM VESTIDO! ❌❌❌")
          console.error("dressId válido?", !!dressId)
          console.error("shoesId válido?", !!shoesId)
          console.error("Objeto completo recebido:", data)
          throw new Error("IDs das peças não foram retornados pelo N8N")
        }
      } else {
        // Look tradicional: precisa de top + bottom + shoes
        if (!topId || !bottomId || !shoesId) {
          console.error("❌❌❌ IDs INVÁLIDOS PARA LOOK TRADICIONAL! ❌❌❌")
          console.error("topId válido?", !!topId)
          console.error("bottomId válido?", !!bottomId)
          console.error("shoesId válido?", !!shoesId)
          console.error("Objeto completo recebido:", data)
          throw new Error("IDs das peças não foram retornados pelo N8N")
        }
      }

      console.log("\n✅ [DEBUG] Todos os IDs são válidos! Prosseguindo com busca no Supabase...")

      if (data.success !== undefined ? data.success : true) { // Permitir continuar mesmo se success não existir
        console.log("\n\n🔍 [DEBUG] ========== INICIANDO BUSCA DE ITENS NO SUPABASE ==========")
        console.log("🔍 [DEBUG] Tipo de look:", isDressLook ? "VESTIDO" : "TRADICIONAL")

        let processedLook: ProcessedLook

        if (isDressLook) {
          // LOOK COM VESTIDO: buscar apenas dress + shoes
          console.log("👗 [DEBUG] ========== BUSCANDO DRESS NO SUPABASE ==========")
          console.log("👗 [DEBUG] Usando variável dressId:", dressId)

          const { data: dressItem, error: dressError } = await supabase
            .from("closet_items")
            .select("*")
            .eq("id", dressId)
            .single()

          console.log("👗 [DEBUG] ========== RESULTADO DA BUSCA DRESS ==========")
          console.log("👗 [DEBUG] Item encontrado:", dressItem)
          console.log("👗 [DEBUG] Erro:", dressError)

          console.log("\n👟 [DEBUG] ========== BUSCANDO SHOES NO SUPABASE ==========")
          console.log("👟 [DEBUG] Usando variável shoesId:", shoesId)

          const { data: shoesItem, error: shoesError } = await supabase
            .from("closet_items")
            .select("*")
            .eq("id", shoesId)
            .single()

          console.log("👟 [DEBUG] ========== RESULTADO DA BUSCA SHOES ==========")
          console.log("👟 [DEBUG] Item encontrado:", shoesItem)
          console.log("👟 [DEBUG] Erro:", shoesError)

          // Verificar se os itens foram encontrados
          if (!dressItem || !shoesItem) {
            console.error("❌ [DEBUG] Algum item não foi encontrado no Supabase!")
            console.error("  DRESS:", dressItem ? "✅ FOUND" : "❌ NOT FOUND")
            console.error("  SHOES:", shoesItem ? "✅ FOUND" : "❌ NOT FOUND")
            throw new Error("Itens do look não encontrados no banco de dados")
          }

          console.log("\n🖼️ [DEBUG] ========== CONSTRUINDO LOOK COM VESTIDO ==========")
          processedLook = {
            dress: {
              id: dressItem.id,
              name: dressItem.name,
              image_url: dressItem.image_url
            },
            shoes: {
              id: shoesItem.id,
              name: shoesItem.name,
              image_url: shoesItem.image_url
            },
            reasoning: reasoning || "Look criado com sucesso!"
          }

          // Salvar imagens separadamente
          setLookImages({
            top: null,
            bottom: null,
            dress: dressItem.image_url,
            shoes: shoesItem.image_url,
          })

          console.log("🖼️ [DEBUG] ✅ Look com vestido criado!")
          console.log("  👗 DRESS:", dressItem.name)
          console.log("  👟 SHOES:", shoesItem.name)

        } else {
          // LOOK TRADICIONAL: buscar top + bottom + shoes
          console.log("\n👕 [DEBUG] ========== BUSCANDO TOP NO SUPABASE ==========")
          console.log("👕 [DEBUG] Usando variável topId:", topId)

          const { data: topItem, error: topError } = await supabase
            .from("closet_items")
            .select("*")
            .eq("id", topId)
            .single()

          console.log("👕 [DEBUG] ========== RESULTADO DA BUSCA TOP ==========")
          console.log("👕 [DEBUG] Item encontrado:", topItem)
          console.log("👕 [DEBUG] Erro:", topError)

          console.log("\n👖 [DEBUG] ========== BUSCANDO BOTTOM NO SUPABASE ==========")
          console.log("👖 [DEBUG] Usando variável bottomId:", bottomId)

          const { data: bottomItem, error: bottomError } = await supabase
            .from("closet_items")
            .select("*")
            .eq("id", bottomId)
            .single()

          console.log("👖 [DEBUG] ========== RESULTADO DA BUSCA BOTTOM ==========")
          console.log("👖 [DEBUG] Item encontrado:", bottomItem)
          console.log("👖 [DEBUG] Erro:", bottomError)

          console.log("\n👟 [DEBUG] ========== BUSCANDO SHOES NO SUPABASE ==========")
          console.log("👟 [DEBUG] Usando variável shoesId:", shoesId)

          const { data: shoesItem, error: shoesError } = await supabase
            .from("closet_items")
            .select("*")
            .eq("id", shoesId)
            .single()

          console.log("👟 [DEBUG] ========== RESULTADO DA BUSCA SHOES ==========")
          console.log("👟 [DEBUG] Item encontrado:", shoesItem)
          console.log("👟 [DEBUG] Erro:", shoesError)

          // Verificar se todos os itens foram encontrados
          if (!topItem || !bottomItem || !shoesItem) {
            console.error("❌ [DEBUG] Algum item não foi encontrado no Supabase!")
            console.error("  TOP:", topItem ? "✅ FOUND" : "❌ NOT FOUND")
            console.error("  BOTTOM:", bottomItem ? "✅ FOUND" : "❌ NOT FOUND")
            console.error("  SHOES:", shoesItem ? "✅ FOUND" : "❌ NOT FOUND")
            throw new Error("Itens do look não encontrados no banco de dados")
          }

          console.log("\n🖼️ [DEBUG] ========== CONSTRUINDO LOOK TRADICIONAL ==========")
          processedLook = {
            top: {
              id: topItem.id,
              name: topItem.name,
              image_url: topItem.image_url
            },
            bottom: {
              id: bottomItem.id,
              name: bottomItem.name,
              image_url: bottomItem.image_url
            },
            shoes: {
              id: shoesItem.id,
              name: shoesItem.name,
              image_url: shoesItem.image_url
            },
            reasoning: reasoning || "Look criado com sucesso!"
          }

          // Salvar imagens separadamente
          setLookImages({
            top: topItem.image_url,
            bottom: bottomItem.image_url,
            dress: null,
            shoes: shoesItem.image_url,
          })

          console.log("🖼️ [DEBUG] ✅ Look tradicional criado!")
          console.log("  👕 TOP:", topItem.name)
          console.log("  👖 BOTTOM:", bottomItem.name)
          console.log("  👟 SHOES:", shoesItem.name)
        }

        console.log("🖼️ [DEBUG] Look processado criado:", processedLook)

        // Salvar look processado no state
        setLook(processedLook)

        console.log("🖼️ [DEBUG] ✅ States atualizados com sucesso!")
        console.log("========================================\n\n")
      }
    } catch (err: any) {
      console.error("❌ ============ ERRO CAPTURADO ============")
      console.error("Tipo do erro:", err.constructor.name)
      console.error("Mensagem:", err.message)
      console.error("Stack trace:", err.stack)
      console.error("Erro completo:", err)

      // Logs adicionais para erros de rede
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.error("🔴 ERRO DE REDE DETECTADO!")
        console.error("Possíveis causas:")
        console.error("1. CORS bloqueado pelo N8N")
        console.error("2. N8N workflow não está ativo")
        console.error("3. URL incorreta ou N8N fora do ar")
        console.error("4. Problema de certificado SSL")
      }

      console.error("==========================================")
      setError(err.message || "Erro ao gerar seu look")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!look) return

    try {
      setIsSharing(true)

      // Get quiz answers for context
      const answersJson = localStorage.getItem("amiguei-quiz-answers")
      let quizContext = {}
      if (answersJson) {
        const answers = JSON.parse(answersJson)
        quizContext = {
          occasion: answers[0] || null,
          style: answers[2] || null,
          climate: answers[1] || null,
        }
      }

      // Create shareable look via API
      const sharePayload: any = {
        shoes_item_id: look.shoes.id,
        reasoning: look.reasoning,
        ...quizContext,
      }

      // Add dress or top+bottom
      if (look.dress) {
        sharePayload.dress_item_id = look.dress.id
      } else {
        sharePayload.top_item_id = look.top?.id
        sharePayload.bottom_item_id = look.bottom?.id
      }

      const response = await fetch('/api/share-look', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sharePayload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar link compartilhável')
      }

      const shareUrl = data.share_url

      // Try to use native share API
      if (navigator.share) {
        await navigator.share({
          title: 'Meu Look - Amiguei.AI',
          text: `Confira meu look criado com Amiguei.AI! 👗✨`,
          url: shareUrl,
        })
        toast.success('Look compartilhado com sucesso! 🎉')
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(shareUrl)
        setShareUrl(shareUrl)
        toast.success('Link copiado para área de transferência! 📋')

        // Reset after 3 seconds
        setTimeout(() => {
          setShareUrl(null)
        }, 3000)
      }
    } catch (err: any) {
      console.error('Erro ao compartilhar:', err)
      if (err.name !== 'AbortError') {
        toast.error('Erro ao compartilhar. Tente novamente.')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // TODO: Implementar no N8N antes de reativar
  // Esta função requer modificação no workflow N8N para processar replace_only
  /*
  const refreshSingleItem = async (itemType: 'top' | 'bottom' | 'shoes') => {
    if (!look) return

    try {
      setRefreshingItem(itemType)
      setError(null)

      // Pegar usuário logado
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Você precisa estar logado para gerar looks!")
        return
      }

      const answersJson = localStorage.getItem("amiguei-quiz-answers")
      if (!answersJson) {
        setError("Respostas do quiz não encontradas")
        return
      }

      const answers = JSON.parse(answersJson)
      const quizResponses = {
        occasion: answers[0]?.toLowerCase() || "casual",
        climate: answers[1]?.toLowerCase() || "ameno",
        style: answers[2]?.toLowerCase() || "confortável",
        preferred_colors: answers[3] || "sem preferência",
        extra_info: answers[4] || "",
      }

      // Montar keep_items com as peças que NÃO devem ser trocadas
      const keepItems: Record<string, string> = {}
      if (itemType !== 'top') keepItems.top_item_id = look.look.top.id
      if (itemType !== 'bottom') keepItems.bottom_item_id = look.look.bottom.id
      if (itemType !== 'shoes') keepItems.shoes_item_id = look.look.shoes.id

      const payload = {
        user_id: user.id,
        quiz_responses: quizResponses,
        replace_only: itemType,
        keep_items: keepItems,
      }

      console.log(`🔄 [REFRESH-1/5] Trocando apenas ${itemType}...`)
      console.log(`📦 [REFRESH-2/5] Payload:`, JSON.stringify(payload, null, 2))
      console.log(`🌐 [REFRESH-3/5] URL:`, "https://amiguei.app.n8n.cloud/webhook/outfit-generator")

      const response = await fetch("https://amiguei.app.n8n.cloud/webhook/outfit-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log(`✅ [REFRESH-4/5] Resposta recebida!`)
      console.log(`📡 Status:`, response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Erro do N8N:", errorText)
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }

      const responseText = await response.text()
      console.log(`📦 [REFRESH-5/5] Response text:`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''))

      if (!responseText) {
        throw new Error("N8N retornou resposta vazia")
      }

      const data: LookResponse = JSON.parse(responseText)
      console.log(`✅ [REFRESH-SUCESSO] ${itemType} atualizado:`, data.look?.[itemType])

      // Atualizar apenas a peça específica no estado
      if (data.success && data.look) {
        setLook(data)

        // Buscar nova imagem apenas para o item atualizado
        const newImage = await getItemImage(data.look[itemType].id)
        setLookImages(prev => ({
          ...prev,
          [itemType]: newImage,
        }))
      }
    } catch (err: any) {
      console.error(`❌ ========== ERRO AO TROCAR ${itemType.toUpperCase()} ==========`)
      console.error("Tipo do erro:", err.constructor.name)
      console.error("Mensagem:", err.message)
      console.error("Stack trace:", err.stack)
      console.error("Erro completo:", err)

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.error("🔴 ERRO DE REDE DETECTADO no refresh!")
        console.error("Possíveis causas: CORS, workflow inativo, URL incorreta, SSL")
      }

      console.error("==========================================")
      setError(err.message || `Erro ao trocar ${itemType}`)
    } finally {
      setRefreshingItem(null)
    }
  }
  */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Criando seu look perfeito...</h2>
          <p className="text-gray-600">Nossa IA está trabalhando</p>
        </div>
      </div>
    )
  }

  if (error) {
    // Verificar se o erro é relacionado a closet vazio
    const isEmptyClosetError = error.includes("resposta vazia") || error.includes("não encontrados") || error.includes("IDs das peças")

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          {isEmptyClosetError ? (
            <>
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">Seu closet está vazio!</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Para criar looks personalizados, precisamos que você adicione algumas peças ao seu closet virtual primeiro.
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
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">Ops! Algo deu errado</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/quiz")}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#FF69B4] to-[#E91E63] text-white rounded-xl font-semibold hover:brightness-110 transition-all shadow-md"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Voltar ao início
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!look) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Não foi possível gerar um look</p>
      </div>
    )
  }

  // 🖼️ DEBUG: Log das imagens no render
  console.log("🎨 [RENDER] lookImages state:", lookImages)
  console.log("🎨 [RENDER] TOP image URL:", lookImages.top)
  console.log("🎨 [RENDER] BOTTOM image URL:", lookImages.bottom)
  console.log("🎨 [RENDER] SHOES image URL:", lookImages.shoes)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Botão Voltar ao início - topo */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Seu Look Perfeito!</h1>
          <p className="text-gray-600">Criado especialmente para você</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Container centralizado com max-width de 400px */}
          <div className="max-w-[400px] mx-auto mb-8">
            <div className="flex flex-col items-center">

              {look.dress ? (
                // LOOK COM VESTIDO: mostrar apenas vestido + sapatos
                <>
                  {/* VESTIDO */}
                  <div className="text-center w-full relative z-30">
                    <div className="max-w-[300px] mx-auto h-[450px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {lookImages.dress ? (
                        <Image
                          src={lookImages.dress}
                          alt={look.dress.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 mb-2">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Vestido</p>
                      <p className="font-bold">{look.dress.name}</p>
                    </div>
                  </div>

                  {/* SAPATOS - sobrepõe o vestido */}
                  <div className="text-center w-full relative z-20 -mt-8">
                    <div className="max-w-[300px] mx-auto h-[200px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {lookImages.shoes ? (
                        <Image
                          src={lookImages.shoes}
                          alt={look.shoes.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Shoes</p>
                      <p className="font-bold">{look.shoes.name}</p>
                    </div>
                  </div>
                </>
              ) : (
                // LOOK TRADICIONAL: mostrar top + bottom + shoes
                <>
                  {/* BLUSA - maior z-index */}
                  <div className="text-center w-full relative z-30">
                    <div className="max-w-[300px] mx-auto h-[280px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {lookImages.top ? (
                        <Image
                          src={lookImages.top}
                          alt={look.top?.name || ''}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 mb-2">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Top</p>
                      <p className="font-bold">{look.top?.name}</p>
                    </div>
                  </div>

                  {/* CALÇA - z-index médio, sobrepõe a blusa */}
                  <div className="text-center w-full relative z-20 -mt-8">
                    <div className="max-w-[300px] mx-auto h-[320px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {lookImages.bottom ? (
                        <Image
                          src={lookImages.bottom}
                          alt={look.bottom?.name || ''}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 mb-2">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Bottom</p>
                      <p className="font-bold">{look.bottom?.name}</p>
                    </div>
                  </div>

                  {/* TÊNIS - menor z-index, sobrepõe a calça */}
                  <div className="text-center w-full relative z-10 -mt-8">
                    <div className="max-w-[300px] mx-auto h-[200px] bg-white rounded-xl overflow-hidden relative shadow-md">
                      {lookImages.shoes ? (
                        <Image
                          src={lookImages.shoes}
                          alt={look.shoes.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-500 uppercase mb-1">Shoes</p>
                      <p className="font-bold">{look.shoes.name}</p>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* TODO: Reativar quando o reasoning estiver funcionando corretamente */}
          {/* <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3 text-pink-600">Por que esse look?</h3>
            <p className="text-gray-700 leading-relaxed">{look.reasoning}</p>
          </div> */}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setShowFeedbackDialog(true)}
            disabled={loading}
            className="flex-1 max-w-xs px-8 py-4 border-2 border-pink-500 text-pink-500 rounded-xl font-semibold hover:bg-pink-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Gerando...' : 'Gerar outro look'}
          </button>

          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 max-w-xs px-8 py-4 bg-pink-500 text-white rounded-xl font-semibold hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSharing ? (
              'Compartilhando...'
            ) : shareUrl ? (
              <>
                <Check className="w-5 h-5" />
                Link copiado!
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                Compartilhar Look
              </>
            )}
          </button>
        </div>

        {/* Feedback Dialog */}
        {showFeedbackDialog && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                O que você não gostou neste look?
              </h2>
              <p className="text-gray-600 mb-6">
                Nos conte para gerarmos um look mais adequado para você!
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { value: 'colors', label: 'Não gostei das cores' },
                  { value: 'style', label: 'Não combina com meu estilo' },
                  { value: 'occasion', label: 'Não é adequado para a ocasião' },
                  { value: 'combination', label: 'As peças não combinam entre si' },
                  { value: 'other', label: 'Outro motivo' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFeedback(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedFeedback === option.value
                        ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold'
                        : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFeedbackDialog(false)
                    setSelectedFeedback(null)
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackDialog(false)
                    generateLook(selectedFeedback)
                    setSelectedFeedback(null)
                  }}
                  disabled={!selectedFeedback}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gerar novo look
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}