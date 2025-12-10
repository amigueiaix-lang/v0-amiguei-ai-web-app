

"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

export default function ProfileSetupPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bio, setBio] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("A foto deve ter no máximo 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        setError("Apenas imagens são permitidas")
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleContinue = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("Usuário não encontrado")
        setLoading(false)
        return
      }

      let avatarUrl = null

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop()
        const timestamp = new Date().getTime()
        const fileName = `${user.id}-${timestamp}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, photoFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          setError("Erro ao fazer upload da foto")
          setLoading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: avatarUrl,
          bio: bio || null,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        setError("Erro ao salvar perfil")
        setLoading(false)
        return
      }

      router.push("/welcome")
    } catch (err: any) {
      console.error('Error:', err)
      setError("Erro ao configurar perfil")
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push("/welcome")
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4">
      <div className="w-full max-w-[500px] mx-auto">
        <Logo />

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Configure seu perfil</h1>
          <p className="text-gray-600">
            Adicione uma foto e uma bio para personalizar seu perfil (opcional)
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#FF69B4] transition-colors overflow-hidden bg-gray-50"
            >
              {photoPreview ? (
                <Image 
                  src={photoPreview} 
                  alt="Preview" 
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-sm text-gray-500">Adicionar foto</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview && (
              <button
                onClick={() => {
                  setPhotoPreview(null)
                  setPhotoFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="mt-2 text-sm text-[#FF69B4] hover:underline"
              >
                Remover foto
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio (opcional)
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              maxLength={160}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4] resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {bio.length}/160 caracteres
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleContinue}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 text-base font-semibold disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Continuar"}
            </Button>

            <Button
              onClick={handleSkip}
              variant="outline"
              disabled={loading}
              className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl py-6 text-base font-semibold"
            >
              Pular por enquanto
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
