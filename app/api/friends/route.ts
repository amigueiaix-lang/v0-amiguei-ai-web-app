import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Listar amigos do usuário
export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar amigos com JOIN na tabela users
    const { data: friends, error } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        created_at,
        friend:users!friendships_friend_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar amigos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ friends: friends || [] })
  } catch (err: any) {
    console.error('Erro no GET /api/friends:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE - Remover amigo
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('friendId')

    if (!friendId) {
      return NextResponse.json({ error: 'friendId necessário' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Usar a função do banco para remover amizade
    const { error } = await supabase.rpc('remove_friendship', {
      friend_user_id: friendId
    })

    if (error) {
      console.error('Erro ao remover amigo:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro no DELETE /api/friends:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
