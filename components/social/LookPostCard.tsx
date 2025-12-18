'use client'

import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

interface LookPostCardProps {
  id: string
  userName: string
  userAvatar: string
  lookImages: string[]
  caption: string
  likes: number
  comments: number
  timestamp: string
  isLiked?: boolean
}

export function LookPostCard({
  userName,
  userAvatar,
  lookImages,
  caption,
  likes: initialLikes,
  comments,
  timestamp,
  isLiked: initialIsLiked = false,
}: LookPostCardProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likes, setLikes] = useState(initialLikes)
  const [isSaved, setIsSaved] = useState(false)

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1)
      setIsLiked(false)
    } else {
      setLikes(likes + 1)
      setIsLiked(true)
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
  }

  return (
    <div className="bg-white border-2 border-black rounded-2xl overflow-hidden mb-6">
      {/* Header do Post - Info da usuária */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
          {userAvatar || userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-black">{userName}</p>
          <p className="text-xs text-gray-500">{timestamp}</p>
        </div>
      </div>

      {/* Imagens do Look */}
      <div className="relative aspect-square bg-gray-100">
        {lookImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 h-full">
            {lookImages.map((image, index) => (
              <div
                key={index}
                className="relative bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center"
              >
                <div className="text-4xl">{image}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400">Sem imagem</p>
          </div>
        )}
      </div>

      {/* Ações do Post */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <Heart
                size={24}
                className={isLiked ? 'fill-pink-500 stroke-pink-500' : 'stroke-black'}
              />
            </button>
            <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <MessageCircle size={24} className="stroke-black" />
            </button>
            <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <Share2 size={24} className="stroke-black" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className="hover:opacity-70 transition-opacity"
          >
            <Bookmark
              size={24}
              className={isSaved ? 'fill-black stroke-black' : 'stroke-black'}
            />
          </button>
        </div>

        {/* Curtidas */}
        <p className="font-semibold text-sm mb-2">
          {likes} {likes === 1 ? 'curtida' : 'curtidas'}
        </p>

        {/* Legenda */}
        <div className="mb-2">
          <span className="font-semibold text-sm">{userName} </span>
          <span className="text-sm">{caption}</span>
        </div>

        {/* Comentários */}
        {comments > 0 && (
          <button className="text-sm text-gray-500 hover:text-gray-700">
            Ver todos os {comments} comentários
          </button>
        )}
      </div>
    </div>
  )
}
