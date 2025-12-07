/**
 * Utilitários para processamento de imagens
 * Suporta conversão de HEIC/HEIF para JPEG e compressão
 */

// Tipos suportados
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
] as const

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const TARGET_FILE_SIZE = 2 * 1024 * 1024 // 2MB (tamanho alvo após compressão)

/**
 * Verifica se o arquivo é HEIC/HEIF
 */
export function isHEIC(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

/**
 * Converte HEIC/HEIF para JPEG usando heic2any
 */
export async function convertHEICtoJPEG(file: File): Promise<Blob> {
  try {
    // Importação dinâmica para reduzir bundle inicial
    const heic2any = (await import('heic2any')).default

    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9 // Alta qualidade para JPEG
    })

    // heic2any pode retornar array ou blob único
    return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
  } catch (error) {
    console.error('Erro ao converter HEIC:', error)
    throw new Error('Não foi possível converter a imagem HEIC. Tente usar JPG ou PNG.')
  }
}

/**
 * Comprime imagem se necessário
 */
export async function compressImage(
  blob: Blob,
  maxSize: number = TARGET_FILE_SIZE
): Promise<Blob> {
  // Se já está menor que o tamanho alvo, retorna direto
  if (blob.size <= maxSize) {
    return blob
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'))
        return
      }

      // Manter proporções, reduzir tamanho se necessário
      let width = img.width
      let height = img.height
      const maxDimension = 2048 // Máximo 2048px na maior dimensão

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension
          width = maxDimension
        } else {
          width = (width / height) * maxDimension
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)

      // Tentar diferentes níveis de qualidade até ficar abaixo do tamanho alvo
      let quality = 0.9
      const tryCompress = () => {
        canvas.toBlob(
          (compressedBlob) => {
            if (!compressedBlob) {
              reject(new Error('Erro ao comprimir imagem'))
              return
            }

            // Se ainda está grande e podemos reduzir mais a qualidade
            if (compressedBlob.size > maxSize && quality > 0.5) {
              quality -= 0.1
              tryCompress()
            } else {
              resolve(compressedBlob)
            }
          },
          'image/jpeg',
          quality
        )
      }

      tryCompress()
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Erro ao carregar imagem para compressão'))
    }

    img.src = url
  })
}

/**
 * Processa imagem para upload:
 * 1. Converte HEIC para JPEG se necessário
 * 2. Comprime se maior que o tamanho alvo
 * 3. Retorna File pronto para upload
 */
export async function processImageForUpload(
  file: File,
  onProgress?: (message: string) => void
): Promise<File> {
  try {
    let blob: Blob = file
    let fileName = file.name
    let fileType = file.type

    // 1. Converter HEIC se necessário
    if (isHEIC(file)) {
      onProgress?.('Convertendo foto do iPhone...')
      blob = await convertHEICtoJPEG(file)
      fileName = fileName.replace(/\.(heic|heif)$/i, '.jpg')
      fileType = 'image/jpeg'
    }

    // 2. Comprimir se necessário
    if (blob.size > TARGET_FILE_SIZE) {
      onProgress?.('Otimizando tamanho da imagem...')
      blob = await compressImage(blob)
      fileType = 'image/jpeg' // Compressão sempre gera JPEG
      if (!fileName.match(/\.jpe?g$/i)) {
        fileName = fileName.replace(/\.[^.]+$/, '.jpg')
      }
    }

    // 3. Converter Blob para File
    const processedFile = new File([blob], fileName, {
      type: fileType,
      lastModified: Date.now()
    })

    onProgress?.('Imagem pronta!')
    return processedFile
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    throw error
  }
}

/**
 * Valida arquivo de imagem
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Verificar tamanho máximo
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Imagem muito grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  // Verificar tipo
  const isSupported =
    SUPPORTED_IMAGE_TYPES.includes(file.type as any) ||
    file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)

  if (!isSupported) {
    return {
      valid: false,
      error: 'Formato não suportado. Use JPG, PNG, WebP ou fotos do iPhone (HEIC)'
    }
  }

  return { valid: true }
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
