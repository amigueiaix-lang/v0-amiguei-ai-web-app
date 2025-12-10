
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

export function ProfileAvatar() {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('avatar_url, name')
          .eq('id', user.id)
          .single()

        if (userData) {
          setAvatarUrl(userData.avatar_url)
          setUserName(userData.name || '')
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    router.push('/profile')
  }

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
    )
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      aria-label="Ver perfil"
    >
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#FF69B4] to-[#E91E63] flex items-center justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={userName || "Perfil"}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-semibold text-sm">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </span>
        )}
      </div>
    </button>
  )
}
