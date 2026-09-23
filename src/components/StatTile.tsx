export default function StatTile({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={`rounded-lg border border-club-line border-t-4 border-t-club-navy bg-white p-4 shadow-sm ${className}`}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-club-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-club-navy md:text-3xl">{value}</div>
    </div>
  )
}
