import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// PATCH - Aceitar/rejeitar solicitação
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { action } = await request.json()

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action deve ser "accept" ou "reject"' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (action === 'accept') {
      // Chamar função do banco que cria a amizade bidirecional
      const { error } = await supabase.rpc('accept_friend_request', {
        request_id: params.id
      })

      if (error) {
        console.error('Erro ao aceitar solicitação:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (action === 'reject') {
      // Atualizar status para rejected
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', params.id)
        .eq('receiver_id', user.id)

      if (error) {
        console.error('Erro ao rejeitar solicitação:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro no PATCH /api/friends/requests/[id]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
