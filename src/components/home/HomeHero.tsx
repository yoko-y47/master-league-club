import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import type { News } from '@/lib/news'

export default function HomeHero({ clubName, slides }: { clubName: string; slides: News[] }) {
  const [index, setIndex] = useState(0)
  const count = slides.length

  useEffect(() => {
    if (count < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 6000)
    return () => clearInterval(timer)
  }, [count])

  if (count === 0) {
    return (
      <section className="flex min-h-[280px] flex-col items-center justify-center gap-4 bg-club-navy px-6 py-16 text-center text-white md:h-full md:min-h-[420px]">
        <ClubCrest size="lg" alt={`${clubName} crest`} />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide md:text-5xl">{clubName}</h1>
      </section>
    )
  }

  const current = slides[index % count]

  return (
    <section className="relative min-h-[300px] overflow-hidden bg-club-navy text-white md:h-full md:min-h-[420px]">
      <Link to={`/news/${current.slug}`} className="absolute inset-0 flex flex-col justify-end">
        {current.cover_image_url && (
          <img src={current.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-club-navy-2/90 via-club-navy/40 to-club-navy/10" />
        <h1 className="relative px-6 pb-14 font-display text-2xl font-bold leading-tight md:px-10 md:pb-16 md:text-4xl">
          {current.title}
        </h1>
      </Link>

      {count > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-6 bg-white/50'}`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="prev"
            onClick={() => setIndex((index - 1 + count) % count)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 px-2 py-3 text-2xl text-white/80 hover:text-white md:block"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="next"
            onClick={() => setIndex((index + 1) % count)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 px-2 py-3 text-2xl text-white/80 hover:text-white md:block"
          >
            ›
          </button>
        </>
      )}
    </section>
  )
}
