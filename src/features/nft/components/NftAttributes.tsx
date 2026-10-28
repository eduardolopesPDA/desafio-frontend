import { useId } from 'react'
import type { NftDetail } from '@/contracts'

const ATTRIBUTES: { key: keyof NftDetail['attributes']; label: string; color: string }[] = [
  { key: 'forca', label: 'Força', color: 'bg-toon-yellow' },
  { key: 'caos', label: 'Caos', color: 'bg-elmore-pink' },
  { key: 'nostalgia', label: 'Nostalgia', color: 'bg-ooo-blue' },
]

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  const labelId = useId()
  return (
    <div>
      <div className="flex items-baseline justify-between font-bold">
        <span id={labelId}>{label}</span>
        <span className="font-display text-lg">{value}</span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1 h-5 overflow-hidden rounded-full border-2 border-ink bg-paper"
      >
        <div className={`h-full border-r-2 border-ink ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function NftAttributes({ attributes }: { attributes: NftDetail['attributes'] }) {
  return (
    <div className="grid gap-5">
      {ATTRIBUTES.map(({ key, label, color }) => (
        <Meter key={key} label={label} value={attributes[key]} color={color} />
      ))}
    </div>
  )
}
