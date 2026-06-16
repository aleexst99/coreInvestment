import { create } from 'zustand'
import type { User, Asset, Investment, AssetValue, ScheduledInvestment } from '../types'

interface AppStore {
  user: User | null
  setUser: (user: User | null) => void

  assets: Asset[]
  setAssets: (assets: Asset[]) => void

  investments: Investment[]
  setInvestments: (investments: Investment[]) => void

  assetValues: AssetValue[]
  setAssetValues: (values: AssetValue[]) => void

  scheduledInvestments: ScheduledInvestment[]
  setScheduledInvestments: (scheduled: ScheduledInvestment[]) => void

  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  assets: [],
  setAssets: (assets) => set({ assets }),

  investments: [],
  setInvestments: (investments) => set({ investments }),

  assetValues: [],
  setAssetValues: (assetValues) => set({ assetValues }),

  scheduledInvestments: [],
  setScheduledInvestments: (scheduledInvestments) => set({ scheduledInvestments }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
