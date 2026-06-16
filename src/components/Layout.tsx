import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { processScheduledInvestments } from '../lib/scheduledInvestments'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate()
  const { setAssets, setInvestments, setAssetValues, setScheduledInvestments, investments } = useAppStore()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [assets, investments, assetValues, scheduled] = await Promise.all([
      supabase.from('assets').select('*').eq('user_id', user.id),
      supabase.from('investments').select('*, asset:assets(*)').eq('user_id', user.id),
      supabase.from('asset_values').select('*, asset:assets(*)').eq('user_id', user.id),
      supabase.from('scheduled_investments').select('*, asset:assets(*)').eq('user_id', user.id),
    ])

    if (assets.data) setAssets(assets.data)
    if (investments.data) setInvestments(investments.data)
    if (assetValues.data) setAssetValues(assetValues.data)
    if (scheduled.data) {
      setScheduledInvestments(scheduled.data)

      const newInvestments = await processScheduledInvestments(scheduled.data, user.id)
      if (newInvestments.length > 0) {
        setInvestments([...(investments.data ?? []), ...newInvestments])
      }
    }

    // Auto-calculate value for real estate assets with interest
    if (assets.data && investments.data) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      let valuesChanged = false

      for (const asset of assets.data) {
        if (asset.type !== 'inmueble' || !asset.interest_rate || !asset.interest_end_date) continue

        const capital = investments.data
          .filter((inv: { asset_id: string; amount: number }) => inv.asset_id === asset.id)
          .reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0)

        if (capital === 0) continue

        const alreadyExists = assetValues.data?.some(
          (v: { asset_id: string; date: string }) => v.asset_id === asset.id && v.date === todayStr
        )
        if (alreadyExists) continue

        const endDate = new Date(asset.interest_end_date)
        endDate.setHours(0, 0, 0, 0)

        const value = today >= endDate
          ? capital * (1 + asset.interest_rate / 100)
          : capital

        await supabase.from('asset_values').insert({
          user_id: user.id,
          asset_id: asset.id,
          value: Math.round(value * 100) / 100,
          date: todayStr,
        })

        valuesChanged = true
      }

      if (valuesChanged) {
        const { data: updatedValues } = await supabase
          .from('asset_values')
          .select('*, asset:assets(*)')
          .eq('user_id', user.id)

        if (updatedValues) setAssetValues(updatedValues)
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950">

      <nav className="bg-slate-900 border-b border-slate-800 h-16 flex items-center px-8 gap-8">
        <span className="text-white font-bold text-lg tracking-tight mr-4">
          💰 Core Investment
        </span>

        <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
          Dashboard
        </Link>
        <Link to="/transactions" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
          Investments
        </Link>
        <Link to="/assets" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
          Assets
        </Link>
        <Link to="/scheduled" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
          Scheduled
        </Link>

        <button
          onClick={handleLogout}
          className="ml-auto text-slate-500 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8">
        {children}
      </main>

    </div>
  )
}
