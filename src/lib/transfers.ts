import { useLanguage } from './i18n/LanguageContext'

export type TransferType = 'signing' | 'sale' | 'loan_out' | 'loan_in' | 'free' | 'youth_promotion'

export type Transfer = {
  id: string
  player_id: string
  season_id: string
  transfer_date: string
  from_club: string | null
  to_club: string | null
  transfer_type: TransferType
  fee: number | null
  created_at: string
}

export function useTransferTypeLabels(): Record<TransferType, string> {
  const { t } = useLanguage()
  return {
    signing: t('transferType.signing'),
    sale: t('transferType.sale'),
    loan_out: t('transferType.loan_out'),
    loan_in: t('transferType.loan_in'),
    free: t('transferType.free'),
    youth_promotion: t('transferType.youth_promotion'),
  }
}
