import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import type { Asset } from '../types'

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      assets: [],
      investments: [],
      assetValues: [],
      scheduledInvestments: [],
      user: null,
      isLoading: false,
    })
  })

  it('starts with empty assets', () => {
    const { assets } = useAppStore.getState()
    expect(assets).toEqual([])
  })

  it('sets assets correctly', () => {
    const mockAssets: Asset[] = [
      {
        id: '1',
        user_id: 'user-1',
        name: 'Bitcoin',
        type: 'crypto',
        color: '#f7931a',
        interest_rate: null,
        interest_end_date: null,
        created_at: '2025-01-01',
      },
    ]

    useAppStore.getState().setAssets(mockAssets)
    expect(useAppStore.getState().assets).toEqual(mockAssets)
  })

  it('sets loading state correctly', () => {
    useAppStore.getState().setIsLoading(true)
    expect(useAppStore.getState().isLoading).toBe(true)

    useAppStore.getState().setIsLoading(false)
    expect(useAppStore.getState().isLoading).toBe(false)
  })

  it('sets user correctly', () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' }
    useAppStore.getState().setUser(mockUser)
    expect(useAppStore.getState().user).toEqual(mockUser)
  })

  it('clears user on logout', () => {
    useAppStore.getState().setUser({ id: 'user-1', email: 'test@test.com' })
    useAppStore.getState().setUser(null)
    expect(useAppStore.getState().user).toBeNull()
  })
})
