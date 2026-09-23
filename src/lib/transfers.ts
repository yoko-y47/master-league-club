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

export const transferTypeLabels: Record<TransferType, string> = {
  signing: 'Signing',
  sale: 'Sale',
  loan_out: 'Loan Out',
  loan_in: 'Loan In',
  free: 'Free Transfer',
  youth_promotion: 'Youth Promotion',
}
