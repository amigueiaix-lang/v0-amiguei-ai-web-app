'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, UserMinus, Loader2, UserPlus } from 'lucide-react'
import type { Friend } from '@/types/friends'
import { toast } from 'sonner'

// Usuários sugeridos mockados (será substituído por dados reais da API)
const suggestedUsers = [
  { id: '1', name: 'Mariana Santos', username: 'mari_santos' },
  { id: '2', name: 'Carolina Lima', username: 'carol_lima' },
  { id: '3', name: 'Beatriz Costa', username: 'bia_costa' },
  { id: '4', name: 'Larissa Oliveira', username: 'lari_oliveira' },
  { id: '5', name: 'Gabriela Souza', username: 'gabi_souza' },
]

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null)

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends')
      const data = await res.json()

      if (res.ok) {
        setFriends(data.friends || [])
      } else {
        toast.error(data.error || 'Erro ao carregar amigos')
      }
    } catch (error) {
      console.error('Erro ao buscar amigos:', error)
      toast.error('Erro ao carregar amigos')
    } finally {
      setLoading(false)
    }
  }

  const removeFriend = async (friendId: string, friendName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${friendName} dos seus amigos?`)) {
      return
    }

    setRemovingId(friendId)

    try {
      const res = await fetch(`/api/friends?friendId=${friendId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Amigo removido com sucesso')
        fetchFriends()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao remover amigo')
      }
    } catch (error) {
      console.error('Erro ao remover amigo:', error)
      toast.error('Erro ao remover amigo')
    } finally {
      setRemovingId(null)
    }
  }

  const sendFriendRequest = async (userId: string, userName: string) => {
    setSendingRequestTo(userId)

    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId })
      })

      if (res.ok) {
        toast.success(`Solicitação enviada para ${userName}!`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao enviar solicitação')
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error)
      toast.error('Erro ao enviar solicitação')
    } finally {
      setSendingRequestTo(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF69B4]" />
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-semibold mb-2">Você ainda não tem amigas</p>
          <p className="text-sm text-gray-400">Adicione pessoas da comunidade Amiguei.AI!</p>
        </div>

        {/* Sugestões */}
        <div>
          <h3 className="text-lg font-semibold text-black mb-4">Pessoas que você pode conhecer</h3>
          <div className="space-y-3">
            {suggestedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#FF69B4] transition-colors"
              >
                <div>
                  <p className="font-semibold text-black">{user.name}</p>
                  <p className="text-sm text-[#FF69B4] font-medium">@{user.username}</p>
                </div>

                <Button
                  size="sm"
                  onClick={() => sendFriendRequest(user.id, user.name)}
                  disabled={sendingRequestTo === user.id}
                  className="bg-[#FF69B4] hover:bg-[#E91E63] text-white rounded-xl"
                >
                  {sendingRequestTo === user.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Sugestões de pessoas */}
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">Pessoas que você pode conhecer</h3>
        <div className="space-y-3">
          {suggestedUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#FF69B4] transition-colors"
            >
              <div>
                <p className="font-semibold text-black">{user.name}</p>
                <p className="text-sm text-[#FF69B4] font-medium">@{user.username}</p>
              </div>

              <Button
                size="sm"
                onClick={() => sendFriendRequest(user.id, user.name)}
                disabled={sendingRequestTo === user.id}
                className="bg-[#FF69B4] hover:bg-[#E91E63] text-white rounded-xl"
              >
                {sendingRequestTo === user.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Adicionar
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Minhas Amigas */}
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">
          Minhas Amigas ({friends.length})
        </h3>
        <div className="space-y-3">
          {friends.map((f) => (
            <div
              key={f.friend_id}
              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#FF69B4] transition-colors"
            >
              <div>
                <p className="font-semibold text-black">{f.friend.name}</p>
                <p className="text-sm text-[#FF69B4] font-medium">@{f.friend.username || 'username'}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFriend(f.friend_id, f.friend.name)}
                disabled={removingId === f.friend_id}
                className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200 rounded-xl"
              >
                {removingId === f.friend_id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserMinus className="w-4 h-4 mr-2" />
                )}
                Remover
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
