'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2, UserPlus } from 'lucide-react'
import type { FriendRequest } from '@/types/friends'
import { toast } from 'sonner'

interface FriendRequestsData {
  received: FriendRequest[]
  sent: FriendRequest[]
}

export function FriendRequestsList() {
  const [requests, setRequests] = useState<FriendRequestsData>({ received: [], sent: [] })
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/friends/requests')
      const data = await res.json()

      if (res.ok) {
        setRequests({
          received: data.received || [],
          sent: data.sent || []
        })
      } else {
        toast.error(data.error || 'Erro ao carregar solicitações')
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error)
      toast.error('Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessingId(requestId)

    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        toast.success(action === 'accept' ? 'Solicitação aceita!' : 'Solicitação rejeitada')
        fetchRequests()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao processar solicitação')
      }
    } catch (error) {
      console.error('Erro ao processar solicitação:', error)
      toast.error('Erro ao processar solicitação')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF69B4]" />
      </div>
    )
  }

  const totalRequests = requests.received.length + requests.sent.length

  if (totalRequests === 0) {
    return (
      <div className="text-center py-12">
        <UserPlus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Nenhuma solicitação pendente</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Solicitações Recebidas */}
      <div>
        <h3 className="font-semibold text-lg mb-4">
          Solicitações Recebidas ({requests.received.length})
        </h3>

        {requests.received.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma solicitação recebida</p>
        ) : (
          <div className="space-y-3">
            {requests.received.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#FF69B4] transition-colors"
              >
                <div>
                  <p className="font-semibold text-black">{req.sender?.name}</p>
                  <p className="text-sm text-gray-500">{req.sender?.email}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(req.id, 'accept')}
                    disabled={processingId === req.id}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {processingId === req.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Aceitar
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequest(req.id, 'reject')}
                    disabled={processingId === req.id}
                    className="text-red-500 hover:bg-red-50 border-red-200"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitações Enviadas */}
      <div>
        <h3 className="font-semibold text-lg mb-4">
          Solicitações Enviadas ({requests.sent.length})
        </h3>

        {requests.sent.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma solicitação enviada</p>
        ) : (
          <div className="space-y-3">
            {requests.sent.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-black">{req.receiver?.name}</p>
                  <p className="text-sm text-gray-500">Aguardando resposta...</p>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Pendente</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
