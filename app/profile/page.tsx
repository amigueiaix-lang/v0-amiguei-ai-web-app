"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Camera, Edit2, Save, X } from "lucide-react"

interface UserProfile {
  name: string
  username: string
  email: string
  bio: string | null
  avatar_url: string | null
  cor_raca: string | null
  cabelo_cor: string | null
  estilo_corpo: string | null
  imagem_dia_a_dia: string[] | null
  onboarding_completed: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [editedBio, setEditedBio] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const profileData: UserProfile = {
        name: userData.name || '',
        username: userData.username || '',
        email: user.email || '',
        bio: userData.bio,
        avatar_url: userData.avatar_url,
        cor_raca: userData.cor_raca,
        cabelo_cor: userData.cabelo_cor,
        estilo_corpo: userData.estilo_corpo,
        imagem_dia_a_dia: userData.imagem_dia_a_dia,
        onboarding_completed: userData.onboarding_completed || false,
      }

      setProfile(profileData)
      setEditedBio(profileData.bio || "")
    } catch (error) {
      console.error('Error loading profile:', error)
      setError("Erro ao carregar perfil")
    } finally {
      setLoading(false)
    }
  }

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

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let newAvatarUrl = profile?.avatar_url

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
          setSaving(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath)

        newAvatarUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          bio: editedBio || null,
          avatar_url: newAvatarUrl,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        setError("Erro ao salvar perfil")
        setSaving(false)
        return
      }

      await loadProfile()
      setEditing(false)
      setPhotoFile(null)
      setPhotoPreview(null)
    } catch (err: any) {
      console.error('Error:', err)
      setError("Erro ao salvar perfil")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setEditedBio(profile?.bio || "")
    setPhotoFile(null)
    setPhotoPreview(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF69B4]"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Perfil não encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/closet" className="flex items-center gap-2 text-gray-700 hover:text-[#FF69B4] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </Link>
          <Logo />
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-[#FF69B4] to-[#E91E63] h-32"></div>
          
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex justify-between items-start -mt-16 mb-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden">
                  {(photoPreview || profile.avatar_url) ? (
                    <Image
                      src={photoPreview || profile.avatar_url!}
                      alt={profile.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FF69B4] to-[#E91E63] flex items-center justify-center text-white text-4xl font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {editing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#FF69B4] text-white flex items-center justify-center hover:brightness-110 transition-all shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div>
                {!editing ? (
                  <Button
                    onClick={() => setEditing(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar Perfil
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-[#FF69B4] hover:brightness-110"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-600">@{profile.username}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>

              {/* Bio */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Bio</h2>
                {editing ? (
                  <Textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                    maxLength={160}
                    rows={3}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-700">{profile.bio || "Sem bio ainda"}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Quiz Results */}
              {profile.onboarding_completed && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Informações de Estilo</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.cor_raca && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Cor/Raça</p>
                        <p className="font-semibold text-gray-900">{profile.cor_raca}</p>
                      </div>
                    )}
                    
                    {profile.cabelo_cor && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Cor do Cabelo</p>
                        <p className="font-semibold text-gray-900">{profile.cabelo_cor}</p>
                      </div>
                    )}
                    
                    {profile.estilo_corpo && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Estilo de Corpo</p>
                        <p className="font-semibold text-gray-900">{profile.estilo_corpo}</p>
                      </div>
                    )}
                    
                    {profile.imagem_dia_a_dia && profile.imagem_dia_a_dia.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                        <p className="text-sm text-gray-600 mb-2">Imagem Dia a Dia</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.imagem_dia_a_dia.map((style, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gradient-to-r from-[#FF69B4] to-[#E91E63] text-white rounded-full text-sm"
                            >
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button
                      onClick={() => router.push('/onboarding/1')}
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      Refazer Quiz
                    </Button>
                  </div>
                </div>
              )}

              {!profile.onboarding_completed && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="bg-gradient-to-br from-[#FF69B4]/10 to-[#E91E63]/10 border border-[#FF69B4]/20 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-2">Complete seu perfil!</h3>
                    <p className="text-gray-700 mb-4">Responda o quiz para receber recomendações personalizadas de looks.</p>
                    <Button
                      onClick={() => router.push('/onboarding/1')}
                      className="bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110"
                    >
                      Responder Quiz
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
