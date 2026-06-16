import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { processScheduledInvestments } from '../lib/scheduledInvestments'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAssets, setInvestments, setAssetValues, setScheduledInvestments } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // Cierra el menú al cambiar de página
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

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

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/transactions', label: 'Investments' },
    { to: '/assets', label: 'Assets' },
    { to: '/scheduled', label: 'Scheduled' },
  ]

  return (
    <div className="min-h-screen bg-slate-950">

      <nav className="bg-slate-900 border-b border-slate-800 h-16 flex items-center px-6 lg:px-8">
        {/* Logo */}
        <span className="text-white font-bold text-lg tracking-tight">
          💰 Core Investment
        </span>

        {/* Links — hidden on mobile/tablet */}
        <div className="hidden lg:flex items-center gap-6 ml-8">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Sign out — hidden on mobile/tablet */}
        <button
          onClick={handleLogout}
          className="hidden lg:block ml-auto text-slate-500 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>

        {/* Hamburger — visible on mobile/tablet */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden ml-auto text-slate-400 hover:text-white p-2"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col gap-4">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-left text-sm text-slate-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {children}
      </main>

    </div>
  )
}
