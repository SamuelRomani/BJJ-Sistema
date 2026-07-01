// Avatar com cor derivada do nome — consistente em todo o app
const PALETTE = [
  '#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444',
  '#06b6d4','#ec4899','#84cc16','#f97316','#6366f1',
]

function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface AvatarProps {
  nome: string
  foto_url?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }

export function Avatar({ nome, foto_url, size = 'md', className = '' }: AvatarProps) {
  const bg = colorFromName(nome)
  const cls = `${SIZE[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${className}`

  if (foto_url) {
    return <img src={foto_url} alt={nome} className={`${cls} object-cover`} />
  }

  return (
    <div className={cls} style={{ backgroundColor: bg }}>
      {initials(nome)}
    </div>
  )
}
