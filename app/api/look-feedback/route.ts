import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST - Save user feedback on a generated look
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
    const {
      user_id,
      top_item_id,
      bottom_item_id,
      dress_item_id,
      shoes_item_id,
      feedback_type,
      occasion,
      climate,
      style,
    } = body

    // Validate required fields
    const isDressLook = !!dress_item_id
    const hasRequiredItems = isDressLook
      ? (dress_item_id && shoes_item_id)
      : (top_item_id && bottom_item_id && shoes_item_id)

    if (!hasRequiredItems || !feedback_type) {
      return NextResponse.json(
        {
          error: 'Campos obrigatórios faltando: Para look com vestido (dress_item_id, shoes_item_id) ou look tradicional (top_item_id, bottom_item_id, shoes_item_id), e feedback_type',
        },
        { status: 400 }
      )
    }

    // Validate feedback_type
    const validFeedbackTypes = ['colors', 'style', 'occasion', 'combination', 'other']
    if (!validFeedbackTypes.includes(feedback_type)) {
      return NextResponse.json(
        { error: 'feedback_type inválido' },
        { status: 400 }
      )
    }

    // Insert feedback into database
    const feedbackData: any = {
      user_id: user.id,
      feedback_type,
      shoes_item_id,
      occasion: occasion || null,
      climate: climate || null,
      style: style || null,
    }

    // Add dress or top+bottom based on look type
    if (isDressLook) {
      feedbackData.dress_item_id = dress_item_id
      feedbackData.top_item_id = null
      feedbackData.bottom_item_id = null
    } else {
      feedbackData.top_item_id = top_item_id
      feedbackData.bottom_item_id = bottom_item_id
      feedbackData.dress_item_id = null
    }

    const { data: feedback, error: insertError } = await supabase
      .from('look_feedback')
      .insert(feedbackData)
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao salvar feedback:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      feedback,
    })
  } catch (err: any) {
    console.error('Erro no POST /api/look-feedback:', err)
    return NextResponse.json({ error: err.message || 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Retrieve user's feedback history
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Get user's feedback history
    const { data: feedbacks, error } = await supabase
      .from('look_feedback')
      .select(`
        *,
        top_item:closet_items!look_feedback_top_item_id_fkey(id, name, image_url),
        bottom_item:closet_items!look_feedback_bottom_item_id_fkey(id, name, image_url),
        dress_item:closet_items!look_feedback_dress_item_id_fkey(id, name, image_url),
        shoes_item:closet_items!look_feedback_shoes_item_id_fkey(id, name, image_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar feedbacks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      feedbacks: feedbacks || [],
    })
  } catch (err: any) {
    console.error('Erro no GET /api/look-feedback:', err)
    return NextResponse.json({ error: err.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
