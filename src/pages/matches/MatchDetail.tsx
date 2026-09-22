import { useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'

export default function MatchDetail() {
  const { matchId } = useParams()

  return (
    <>
      <PageHeading title="Match Detail" description={`試合ID: ${matchId}`} />
      <p className="text-sm text-club-muted">Phase 5で出場選手・得点者などの記録UIを実装します。</p>
    </>
  )
}
