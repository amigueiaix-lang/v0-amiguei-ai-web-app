import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST - Create a shareable look link
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { top_item_id, bottom_item_id, dress_item_id, shoes_item_id, reasoning, occasion, style, climate } = body

    // Validate required fields
    const isDressLook = !!dress_item_id
    const hasRequiredItems = isDressLook
      ? (dress_item_id && shoes_item_id)
      : (top_item_id && bottom_item_id && shoes_item_id)

    if (!hasRequiredItems || !reasoning) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: Para look com vestido (dress_item_id, shoes_item_id) ou look tradicional (top_item_id, bottom_item_id, shoes_item_id), e reasoning' },
        { status: 400 }
      )
    }

    // Generate unique share code (8 characters)
    let shareCode: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      // Generate random 8-character code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      shareCode = ''
      for (let i = 0; i < 8; i++) {
        shareCode += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      // Check if code already exists
      const { data: existing } = await supabase
        .from('shared_looks')
        .select('id')
        .eq('share_code', shareCode!)
        .maybeSingle()

      if (!existing) {
        isUnique = true
      }

      attempts++
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Erro ao gerar código único. Tente novamente.' }, { status: 500 })
    }

    // Insert shared look into database
    const sharedLookData: any = {
      user_id: user.id,
      share_code: shareCode!,
      shoes_item_id,
      reasoning,
      occasion: occasion || null,
      style: style || null,
      climate: climate || null,
      view_count: 0,
    }

    // Add dress or top+bottom based on look type
    if (isDressLook) {
      sharedLookData.dress_item_id = dress_item_id
      sharedLookData.top_item_id = null
      sharedLookData.bottom_item_id = null
    } else {
      sharedLookData.top_item_id = top_item_id
      sharedLookData.bottom_item_id = bottom_item_id
      sharedLookData.dress_item_id = null
    }

    const { data: sharedLook, error: insertError } = await supabase
      .from('shared_looks')
      .insert(sharedLookData)
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar shared look:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Return the share code and full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'https://amiguei.ai'
    const shareUrl = `${baseUrl}/look/${shareCode}`

    return NextResponse.json({
      success: true,
      share_code: shareCode,
      share_url: shareUrl,
      shared_look: sharedLook,
    })
  } catch (err: any) {
    console.error('Erro no POST /api/share-look:', err)
    return NextResponse.json({ error: err.message || 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Retrieve a shared look by share code
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const shareCode = searchParams.get('code')

    if (!shareCode) {
      return NextResponse.json({ error: 'Share code não fornecido' }, { status: 400 })
    }

    // Get shared look with all item details
    const { data: sharedLook, error } = await supabase
      .from('shared_looks')
      .select(`
        *,
        top_item:closet_items!shared_looks_top_item_id_fkey(id, name, image_url, category, color),
        bottom_item:closet_items!shared_looks_bottom_item_id_fkey(id, name, image_url, category, color),
        dress_item:closet_items!shared_looks_dress_item_id_fkey(id, name, image_url, category, color),
        shoes_item:closet_items!shared_looks_shoes_item_id_fkey(id, name, image_url, category, color),
        user:users!shared_looks_user_id_fkey(id, name, username)
      `)
      .eq('share_code', shareCode)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar shared look:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!sharedLook) {
      return NextResponse.json({ error: 'Look compartilhado não encontrado' }, { status: 404 })
    }

    // Increment view count
    await supabase
      .from('shared_looks')
      .update({ view_count: sharedLook.view_count + 1 })
      .eq('id', sharedLook.id)

    return NextResponse.json({
      success: true,
      shared_look: sharedLook,
    })
  } catch (err: any) {
    console.error('Erro no GET /api/share-look:', err)
    return NextResponse.json({ error: err.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
