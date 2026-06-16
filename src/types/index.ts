export type AssetType = 'crypto' | 'fondo_indexado' | 'inmueble' | 'oro' | 'acciones' | 'otro'
export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
export type InvestmentType = 'manual' | 'scheduled'

export interface User {
  id: string
  email: string
}

export interface Asset {
  id: string
  user_id: string
  name: string
  type: AssetType
  color: string
  interest_rate: number | null
  interest_end_date: string | null
  created_at: string
}

export interface Investment {
  id: string
  user_id: string
  asset_id: string
  amount: number
  date: string
  notes: string | null
  type: InvestmentType
  created_at: string
  asset?: Asset
}

export interface AssetValue {
  id: string
  user_id: string
  asset_id: string
  value: number
  date: string
  created_at: string
  asset?: Asset
}

export interface ScheduledInvestment {
  id: string
  user_id: string
  asset_id: string
  amount: number
  frequency: Frequency
  next_date: string
  is_active: boolean
  created_at: string
  asset?: Asset
}
