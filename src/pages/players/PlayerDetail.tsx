import { useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'

export default function PlayerDetail() {
  const { playerId } = useParams()

  return (
    <>
      <PageHeading title="Player Detail" description={`選手ID: ${playerId}`} />
      <p className="text-sm text-club-muted">
        Phase 4でプロフィール・所属履歴・シーズン別成績・移籍履歴を表示します。
      </p>
    </>
  )
}
