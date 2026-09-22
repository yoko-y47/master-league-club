export default function PageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 border-b border-club-line pb-4">
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-club-navy md:text-3xl">
        {title}
      </h1>
      {description && <p className="mt-1 text-sm text-club-muted">{description}</p>}
    </div>
  )
}
