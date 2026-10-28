import { useState } from 'react'
import type { Image } from '@/contracts'
import { cn } from '@/lib/utils'

export function NftGallery({ images, name }: { images: Image[]; name: string }) {
  const [index, setIndex] = useState(0)
  const current = images[index] ?? images[0]!

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-2xl border-[3px] border-ink bg-muted shadow-toon-lg">
        <img src={current.src} alt={current.alt} width={800} height={800} fetchPriority="high" className="size-full object-cover" />
      </div>
      {images.length > 1 && (
        <ul aria-label={`Imagens de ${name}`} className="mt-4 flex flex-wrap gap-3">
          {images.map((image, position) => (
            <li key={image.src}>
              <button
                type="button"
                aria-label={`Ver imagem ${position + 1} de ${images.length}`}
                aria-pressed={position === index}
                onClick={() => setIndex(position)}
                className={cn(
                  'block size-20 overflow-hidden rounded-xl border-[3px] sm:size-24',
                  position === index ? 'border-ink shadow-toon-sm' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <img src={image.src} alt="" width={96} height={96} loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
