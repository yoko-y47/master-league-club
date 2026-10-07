export default function PublicPageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8 border-l-4 border-club-gold pl-4 md:pl-5">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-club-navy md:text-4xl">
        {title}
      </h1>
      {description && <p className="mt-2 text-sm text-club-muted">{description}</p>}
    </div>
  )
}
