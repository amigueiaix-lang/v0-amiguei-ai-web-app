'use client'

import { LookPostCard } from './LookPostCard'
import { Plus } from 'lucide-react'
import Link from 'next/link'

// Dados mockados para visualização
const mockPosts = [
  {
    id: '1',
    userName: 'Juliana Silva',
    userAvatar: 'J',
    lookImages: ['👗', '👠', '👜'],
    caption: 'Look perfeito para o casamento da minha amiga! Amei a combinação do vestido com a sandália 💕',
    likes: 42,
    comments: 8,
    timestamp: 'há 2 horas',
    isLiked: false,
  },
  {
    id: '2',
    userName: 'Maria Souza',
    userAvatar: 'M',
    lookImages: ['👚', '👖', '👟'],
    caption: 'Look casual para o dia a dia. Conforto e estilo!',
    likes: 28,
    comments: 5,
    timestamp: 'há 5 horas',
    isLiked: true,
  },
  {
    id: '3',
    userName: 'Ana Costa',
    userAvatar: 'A',
    lookImages: ['👔', '👞'],
    caption: 'Reunião importante hoje! O que acharam da escolha? 💼',
    likes: 35,
    comments: 12,
    timestamp: 'há 1 dia',
    isLiked: false,
  },
  {
    id: '4',
    userName: 'Fernanda Lima',
    userAvatar: 'F',
    lookImages: ['👗', '👡', '🕶️'],
    caption: 'Pronta para o date! Looks que o Amiguei.AI me ajudou a criar ✨',
    likes: 67,
    comments: 15,
    timestamp: 'há 2 dias',
    isLiked: false,
  },
]

export function LooksFeed() {
  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {/* Header do Feed */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Feed de Looks</h2>
        <p className="text-gray-600">Veja os looks das suas amigas e se inspire!</p>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {mockPosts.map((post) => (
          <LookPostCard key={post.id} {...post} />
        ))}
      </div>

      {/* Estado vazio (para quando não houver posts) */}
      {mockPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Ainda não há looks por aqui</p>
          <p className="text-sm text-gray-400">
            Adicione amigas para ver os looks delas!
          </p>
        </div>
      )}

      {/* Botão flutuante para publicar look */}
      <Link href="/publicar-look">
        <button className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50">
          <Plus size={32} strokeWidth={2.5} />
        </button>
      </Link>
    </div>
  )
}
