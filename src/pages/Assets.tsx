import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import type { Asset, AssetType } from '../types'

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'crypto', label: 'Crypto' },
  { value: 'fondo_indexado', label: 'Index fund' },
  { value: 'inmueble', label: 'Real estate' },
  { value: 'oro', label: 'Gold' },
  { value: 'acciones', label: 'Stocks' },
  { value: 'otro', label: 'Other' },
]

const COLORS = ['#f7931a', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899']

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  crypto: 'Crypto',
  fondo_indexado: 'Index fund',
  inmueble: 'Real estate',
  oro: 'Gold',
  acciones: 'Stocks',
  otro: 'Other',
}

export default function Assets() {
  const { assets, setAssets, investments, assetValues } = useAppStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<AssetType>('otro')
  const [color, setColor] = useState(COLORS[0])
  const [interestRate, setInterestRate] = useState('')
  const [interestEndDate, setInterestEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openCreateModal() {
    setEditingAsset(null)
    setName('')
    setType('otro')
    setColor(COLORS[0])
    setInterestRate('')
    setInterestEndDate('')
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(asset: Asset) {
    setEditingAsset(asset)
    setName(asset.name)
    setType(asset.type)
    setColor(asset.color)
    setInterestRate(asset.interest_rate ? String(asset.interest_rate) : '')
    setInterestEndDate(asset.interest_end_date ?? '')
    setError('')
    setIsModalOpen(true)
  }

  function getLatestValue(assetId: string) {
    return assetValues
      .filter(v => v.asset_id === assetId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fields = {
      name: name.trim(),
      type,
      color,
      interest_rate: type === 'inmueble' && interestRate ? parseFloat(interestRate) : null,
      interest_end_date: type === 'inmueble' && interestEndDate ? interestEndDate : null,
    }

    if (editingAsset) {
      const { data, error } = await supabase
        .from('assets').update(fields).eq('id', editingAsset.id).select().single()

      if (error) { setError('Error updating asset'); setIsLoading(false); return }
      setAssets(assets.map(a => a.id === editingAsset.id ? data : a))
    } else {
      const { data, error } = await supabase
        .from('assets').insert({ user_id: user.id, ...fields }).select().single()

      if (error) { setError('Error creating asset'); setIsLoading(false); return }
      setAssets([...assets, data])
    }

    setIsLoading(false)
    setIsModalOpen(false)
  }

  async function handleDelete() {
    if (!deletingAsset) return
    setIsDeleting(true)

    const { error } = await supabase.from('assets').delete().eq('id', deletingAsset.id)
    if (error) { setIsDeleting(false); return }

    setAssets(assets.filter(a => a.id !== deletingAsset.id))
    setDeletingAsset(null)
    setIsDeleting(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Assets</h1>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New asset
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
        {assets.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No assets yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Asset</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Type</th>
                <th className="text-right text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Invested</th>
                <th className="text-right text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Current value</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => {
                const assetInvestments = investments.filter(i => i.asset_id === asset.id)
                const totalInvested = assetInvestments.reduce((sum, i) => sum + i.amount, 0)
                const latest = getLatestValue(asset.id)

                return (
                  <tr key={asset.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                        <span className="text-sm font-semibold text-white">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full">
                        {ASSET_TYPE_LABELS[asset.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white text-right">
                      €{totalInvested.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-white">
                        {latest ? `€${latest.value.toLocaleString()}` : '—'}
                      </span>
                      {latest && (
                        <span className="text-xs text-slate-500 ml-2">
                          {new Date(latest.date).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(asset)}
                          className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingAsset(asset)}
                          className="text-slate-400 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-5">
              {editingAsset ? 'Edit asset' : 'New asset'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bitcoin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AssetType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {ASSET_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {type === 'inmueble' && (
                <div className="flex flex-col gap-3 bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-sm font-semibold text-slate-300">Interest settings</p>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Total interest (%)</label>
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">End date</label>
                    <input
                      type="date"
                      value={interestEndDate}
                      onChange={(e) => setInterestEndDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  {isLoading ? 'Saving...' : editingAsset ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-2">Delete asset?</h2>
            <p className="text-slate-400 text-sm mb-6">
              You are about to delete <span className="text-white font-semibold">"{deletingAsset.name}"</span> and all its contributions. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingAsset(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
