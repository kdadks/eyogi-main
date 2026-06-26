interface TickerItem {
  label: string
}

const FALLBACK: TickerItem[] = [
  { label: 'Indian Knowledge System' },
  { label: 'Yoga & Meditation' },
  { label: 'Sanskrit' },
  { label: 'Mantra Basics' },
  { label: 'Hinduism Basics' },
  { label: 'Stotram Recitation' },
  { label: 'Itihasa' },
  { label: 'Bhagavad Gita' },
  { label: 'Upanishads' },
  { label: 'Darshana Shastra' },
]

export default function HomeMarquee({ items }: { items?: TickerItem[] }) {
  const source = items && items.length > 0 ? items : FALLBACK
  // Duplicate to create seamless loop (ticker keyframe moves -50%)
  const doubled = [...source, ...source]

  return (
    <div
      className="bg-amber-600 overflow-hidden py-3 select-none"
      aria-hidden="true"
    >
      <div className="flex animate-ticker whitespace-nowrap will-change-transform">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-5 text-white text-sm font-medium tracking-wide px-6 shrink-0"
          >
            {item.label}
            <span className="text-amber-300 text-xs">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
