'use client'

import { useState } from 'react'
import { FriendsList } from '@/components/friends/FriendsList'
import { FriendRequestsList } from '@/components/friends/FriendRequestsList'
import { UserSearch } from '@/components/friends/UserSearch'
import { LooksFeed } from '@/components/social/LooksFeed'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type TabType = 'feed' | 'friends' | 'requests' | 'search'

export default function AmigosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('feed')
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-black mb-4 hover:opacity-70"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <h1 className="text-3xl font-bold text-black">Amigas</h1>
          <p className="text-gray-600 mt-2">
            Veja looks, perfis e conecte-se com suas amigas
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'feed'
                  ? 'border-b-2 border-[#FF69B4] text-[#FF69B4]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Feed de Looks
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'friends'
                  ? 'border-b-2 border-[#FF69B4] text-[#FF69B4]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Minhas Amigas
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'border-b-2 border-[#FF69B4] text-[#FF69B4]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Solicitações
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'search'
                  ? 'border-b-2 border-[#FF69B4] text-[#FF69B4]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'feed' && <LooksFeed />}
          {activeTab === 'friends' && <FriendsList />}
          {activeTab === 'requests' && <FriendRequestsList />}
          {activeTab === 'search' && <UserSearch />}
        </div>
      </div>
    </div>
  )
}
