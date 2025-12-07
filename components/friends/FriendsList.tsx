'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, UserMinus, Loader2 } from 'lucide-react'
import type { Friend } from '@/types/friends'
import { toast } from 'sonner'

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF69B4]" />
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Você ainda não tem amigos</p>
        <p className="text-sm text-gray-400 mt-2">Use a aba "Buscar" para encontrar usuários</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'}
      </p>

      {friends.map((f) => (
        <div
          key={f.friend_id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#FF69B4] transition-colors"
        >
          <div>
            <p className="font-semibold text-black">{f.friend.name}</p>
            <p className="text-sm text-gray-500">{f.friend.email}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => removeFriend(f.friend_id, f.friend.name)}
            disabled={removingId === f.friend_id}
            className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
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
  )
}
