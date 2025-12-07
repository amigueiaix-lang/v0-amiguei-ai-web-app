import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Buscar usuários por nome ou email
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query muito curta (mínimo 2 caracteres)' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar usuários por username, nome ou email (priorizar username)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, username')
      .or(`username.ilike.%${query}%,name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', user.id)
      .limit(10)

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Para cada usuário, verificar status de amizade
    const usersWithStatus = await Promise.all(
      users.map(async (u) => {
        // Verificar se é amigo
        const { data: friendship } = await supabase
          .from('friendships')
          .select('id')
          .eq('user_id', user.id)
          .eq('friend_id', u.id)
          .maybeSingle()

        if (friendship) {
          return { ...u, status: 'friends' as const }
        }

        // Verificar solicitação pendente
        const { data: pendingRequest } = await supabase
          .from('friend_requests')
          .select('id, sender_id')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`)
          .eq('status', 'pending')
          .maybeSingle()

        if (pendingRequest) {
          return {
            ...u,
            status: 'pending' as const,
            sentByMe: pendingRequest.sender_id === user.id
          }
        }

        return { ...u, status: 'none' as const }
      })
    )

    return NextResponse.json({ users: usersWithStatus })
  } catch (err: any) {
    console.error('Erro no GET /api/users/search:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
