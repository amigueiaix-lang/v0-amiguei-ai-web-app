import Link from "next/link"
import { Logo } from "@/components/logo"
import { Shirt, Sparkles, Star } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 h-[60px] flex items-center px-6">
        <div className="w-full flex justify-center">
          <div className="max-w-[150px]">
            <Logo />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md flex flex-col gap-[19px] p-8">
          {/* Closet Button */}
          <Link href="/closet">
            <button className="w-full h-20 flex items-center gap-4 px-6 bg-white border-2 border-black rounded-xl text-xl font-medium transition-all duration-300 hover:bg-[#FFE4E1] hover:border-[#FF69B4] hover:shadow-lg hover:scale-[1.02]">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <Shirt size={24} strokeWidth={2} className="text-black" />
              </div>
              <span className="text-left">Closet</span>
            </button>
          </Link>

          {/* Qual look usar Button */}
          <Link href="/quiz">
            <button className="w-full h-20 flex items-center gap-4 px-6 bg-white border-2 border-black rounded-xl text-xl font-medium transition-all duration-300 hover:bg-[#FFE4E1] hover:border-[#FF69B4] hover:shadow-lg hover:scale-[1.02]">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <Sparkles size={24} strokeWidth={2} className="text-black" />
              </div>
              <span className="text-left">Qual look usar</span>
            </button>
          </Link>

          {/* Avaliação do look Button */}
          <Link href="/avaliacao">
            <button className="w-full h-20 flex items-center gap-4 px-6 bg-white border-2 border-black rounded-xl text-xl font-medium transition-all duration-300 hover:bg-[#FFE4E1] hover:border-[#FF69B4] hover:shadow-lg hover:scale-[1.02]">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <Star size={24} strokeWidth={2} className="text-black" />
              </div>
              <span className="text-left">Avaliação do look</span>
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
