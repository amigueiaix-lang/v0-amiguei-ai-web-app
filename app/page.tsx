'use client'

import Link from 'next/link'
import { Shirt, Sparkles, Star } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6">
      {/* Logo */}
      <h1 
        className="text-5xl font-serif text-center mt-8 mb-12" 
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Amiguei<span className="text-pink-500">.</span>AI
      </h1>

      {/* Botões com navegação */}
      <div className="w-full max-w-md flex flex-col gap-5">
        <Link href="/closet">
          <button className="w-full flex items-center gap-4 px-6 py-4 border-2 border-black rounded-xl hover:bg-pink-50 transition-colors">
            <Shirt size={24} strokeWidth={2} />
            <span className="text-lg font-medium">Closet</span>
          </button>
        </Link>

        <Link href="/quiz">
          <button className="w-full flex items-center gap-4 px-6 py-4 border-2 border-black rounded-xl hover:bg-pink-50 transition-colors">
            <Sparkles size={24} strokeWidth={2} />
            <span className="text-lg font-medium">Qual look usar</span>
          </button>
        </Link>

        <Link href="/avaliacao">
          <button className="w-full flex items-center gap-4 px-6 py-4 border-2 border-black rounded-xl hover:bg-pink-50 transition-colors">
            <Star size={24} strokeWidth={2} />
            <span className="text-lg font-medium">Avaliação do look</span>
          </button>
        </Link>
      </div>
    </div>
  )
}