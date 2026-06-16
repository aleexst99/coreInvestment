import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'

const ASSET_TYPES = [
  { value: 'crypto', label: 'Crypto' },
  { value: 'fondo_indexado', label: 'Index fund' },
  { value: 'inmueble', label: 'Real estate' },
  { value: 'oro', label: 'Gold' },
  { value: 'acciones', label: 'Stocks' },
  { value: 'otro', label: 'Other' },
]

const COLORS = ['#f7931a', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899']

export default function Transactions() {
  const { investments, assets, setInvestments, setAssets } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [assetId, setAssetId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [isAddingAsset, setIsAddingAsset] = useState(false)
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetType, setNewAssetType] = useState('otro')
  const [newAssetColor, setNewAssetColor] = useState(COLORS[0])

  function openModal() {
    setAssetId('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setError('')
    setIsAddingAsset(false)
    setNewAssetName('')
    setNewAssetType('otro')
    setNewAssetColor(COLORS[0])
    setIsModalOpen(true)
  }

  function handleAssetChange(value: string) {
    if (value === '__new__') {
      setIsAddingAsset(true)
      setAssetId('')
    } else {
      setIsAddingAsset(false)
      setAssetId(value)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setIsLoading(true)

    let finalAssetId = assetId
    if (isAddingAsset) {
      if (!newAssetName.trim()) {
        setError('Asset name is required')
        setIsLoading(false)
        return
      }

      const { data: newAsset, error: assetError } = await supabase
        .from('assets')
        .insert({ user_id: user.id, name: newAssetName.trim(), type: newAssetType, color: newAssetColor })
        .select()
        .single()

      if (assetError) {
        setError('Error creating asset')
        setIsLoading(false)
        return
      }

      setAssets([...assets, newAsset])
      finalAssetId = newAsset.id
    }

    if (!finalAssetId || !amount) {
      setError('Asset and amount are required')
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id: user.id,
        asset_id: finalAssetId,
        amount: parseFloat(amount),
        date,
        notes: notes || null,
        type: 'manual',
      })
      .select('*, asset:assets(*)')
      .single()

    if (error) {
      setError('Error saving contribution')
      setIsLoading(false)
      return
    }

    setInvestments([...investments, data])
    setIsLoading(false)
    setIsModalOpen(false)
  }

  const sortedInvestments = [...investments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Investments</h1>
        <button
          onClick={openModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New contribution
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {sortedInvestments.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No contributions yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Asset</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-right text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Type</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvestments.map((inv) => {
                const asset = assets.find(a => a.id === inv.asset_id)
                return (
                  <tr key={inv.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: asset?.color }} />
                        <span className="text-sm font-medium text-white">{asset?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(inv.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white text-right">
                      €{inv.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        inv.type === 'manual' ? 'bg-slate-700 text-slate-300' : 'bg-indigo-900 text-indigo-300'
                      }`}>
                        {inv.type === 'manual' ? 'Manual' : 'Scheduled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {inv.notes ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-5">New contribution</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Asset</label>
                <select
                  value={isAddingAsset ? '__new__' : assetId}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select an asset</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                  <option value="__new__">+ Add new asset</option>
                </select>
              </div>

              {isAddingAsset && (
                <div className="flex flex-col gap-3 bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-sm font-semibold text-slate-300">New asset</p>

                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ethereum"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Type</label>
                    <select
                      value={newAssetType}
                      onChange={(e) => setNewAssetType(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      {ASSET_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewAssetColor(color)}
                          className={`w-7 h-7 rounded-full transition-transform ${newAssetColor === color ? 'scale-125 ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-400 text-sm mb-1 block">Amount (€)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-1 block">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-1 block">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly BTC purchase"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
