"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ClothingItem {
  id: string
  name: string
  category: string
  imageUrl: string
  createdAt: number
}

const CATEGORIES = [
  "Camiseta",
  "Blusa",
  "Camisa",
  "Calça",
  "Short",
  "Saia",
  "Vestido",
  "Jaqueta",
  "Casaco",
  "Sapato",
  "Tênis",
  "Sandália",
  "Acessório",
  "Outro",
]

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    imageUrl: "",
  })
  const [imagePreview, setImagePreview] = useState<string>("")

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("amiguei-closet")
    if (stored) {
      setItems(JSON.parse(stored))
    }
  }, [])

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("amiguei-closet", JSON.stringify(items))
    }
  }, [items])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setNewItem({ ...newItem, imageUrl: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddItem = () => {
    if (newItem.name && newItem.category && newItem.imageUrl) {
      const item: ClothingItem = {
        id: Date.now().toString(),
        name: newItem.name,
        category: newItem.category,
        imageUrl: newItem.imageUrl,
        createdAt: Date.now(),
      }
      setItems([...items, item])
      setNewItem({ name: "", category: "", imageUrl: "" })
      setImagePreview("")
      setIsOpen(false)
    }
  }

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id)
    setItems(updatedItems)
    localStorage.setItem("amiguei-closet", JSON.stringify(updatedItems))
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </Link>
          <Logo />
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-24 pb-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-serif font-bold">Meu Closet</h1>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Peça
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif">Nova Peça</DialogTitle>
                  <DialogDescription>Adicione uma nova peça ao seu closet virtual</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Peça</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Blusa branca de seda"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Foto da Peça</Label>
                    <div className="flex flex-col gap-4">
                      <label
                        htmlFor="image"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                      >
                        {imagePreview ? (
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
                          </div>
                        )}
                      </label>
                      <Input id="image" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddItem}
                    disabled={!newItem.name || !newItem.category || !newItem.imageUrl}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Items Grid */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Upload className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-medium mb-2">Seu closet está vazio</h2>
              <p className="text-muted-foreground mb-6">Comece adicionando suas primeiras peças</p>
              <Button
                onClick={() => setIsOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Primeira Peça
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                      aria-label="Deletar peça"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
