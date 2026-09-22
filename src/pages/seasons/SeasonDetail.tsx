import { useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'

export default function SeasonDetail() {
  const { seasonId } = useParams()

  return (
    <>
      <PageHeading title="Season Detail" description={`シーズンID: ${seasonId}`} />
      <p className="text-sm text-club-muted">
        Phase 6で順位・勝敗・得失点・タイトル・チーム成績・選手成績を表示します。
      </p>
    </>
  )
}
