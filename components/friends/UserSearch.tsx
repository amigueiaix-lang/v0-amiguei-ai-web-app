'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, UserPlus, Check, Loader2, Clock } from 'lucide-react'
import type { UserSearchResult } from '@/types/friends'
import { toast } from 'sonner'

export function UserSearch() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null)

  const searchUsers = async () => {
    if (query.length < 2) {
      toast.error('Digite pelo menos 2 caracteres para buscar')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (res.ok) {
        setUsers(data.users || [])
        if (data.users.length === 0) {
          toast.info('Nenhum usuário encontrado')
        }
      } else {
        toast.error(data.error || 'Erro ao buscar usuários')
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast.error('Erro ao buscar usuários')
    } finally {
      setLoading(false)
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
        // Atualizar lista para refletir o novo status
        searchUsers()
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers()
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Busca */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Buscar por @username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 border-2 border-black rounded-xl focus:border-[#FF69B4] focus:ring-[#FF69B4]"
        />
        <Button
          onClick={searchUsers}
          disabled={loading || query.length < 2}
          className="bg-[#FF69B4] hover:bg-[#E91E63] text-white px-6 rounded-xl"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Buscar
        </Button>
      </div>

      {/* Resultados */}
      {users.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {users.length} {users.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
          </p>

          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#FF69B4] transition-colors"
            >
              <div>
                <p className="font-semibold text-black">{user.name}</p>
                <p className="text-sm text-[#FF69B4] font-medium">@{user.username}</p>
              </div>

              {/* Status: Já são amigos */}
              {user.status === 'friends' && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Amigos</span>
                </div>
              )}

              {/* Status: Solicitação pendente */}
              {user.status === 'pending' && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {user.sentByMe ? 'Solicitação enviada' : 'Solicitação recebida'}
                  </span>
                </div>
              )}

              {/* Status: Nenhuma conexão - Pode adicionar */}
              {user.status === 'none' && (
                <Button
                  size="sm"
                  onClick={() => sendFriendRequest(user.id, user.name)}
                  disabled={sendingRequestTo === user.id}
                  className="bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110"
                >
                  {sendingRequestTo === user.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Adicionar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio - ainda não buscou */}
      {users.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Digite um @username para buscar usuários</p>
        </div>
      )}
    </div>
  )
}
