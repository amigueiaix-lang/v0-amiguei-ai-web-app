import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Listar solicitações (enviadas e recebidas)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Solicitações recebidas
    const { data: received, error: receivedError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        created_at,
        sender:users!friend_requests_sender_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (receivedError) {
      console.error('Erro ao buscar solicitações recebidas:', receivedError)
    }

    // Solicitações enviadas
    const { data: sent, error: sentError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        receiver_id,
        created_at,
        receiver:users!friend_requests_receiver_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (sentError) {
      console.error('Erro ao buscar solicitações enviadas:', sentError)
    }

    return NextResponse.json({
      received: received || [],
      sent: sent || []
    })
  } catch (err: any) {
    console.error('Erro no GET /api/friends/requests:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST - Enviar solicitação de amizade
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { receiverId } = await request.json()

    if (!receiverId) {
      return NextResponse.json({ error: 'receiverId necessário' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se está tentando adicionar a si mesmo
    if (user.id === receiverId) {
      return NextResponse.json({ error: 'Você não pode adicionar a si mesmo' }, { status: 400 })
    }

    // Verificar se já existe solicitação (em qualquer direção)
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, sender_id, receiver_id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.sender_id === user.id) {
        return NextResponse.json({ error: 'Solicitação já enviada' }, { status: 400 })
      } else {
        return NextResponse.json({ error: 'Este usuário já enviou uma solicitação para você' }, { status: 400 })
      }
    }

    // Verificar se já são amigos
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', user.id)
      .eq('friend_id', receiverId)
      .maybeSingle()

    if (friendship) {
      return NextResponse.json({ error: 'Vocês já são amigos' }, { status: 400 })
    }

    // Criar solicitação
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar solicitação:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: data })
  } catch (err: any) {
    console.error('Erro no POST /api/friends/requests:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
