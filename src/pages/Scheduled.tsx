import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import type { ScheduledInvestment, Frequency } from '../types'

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
]

const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
}

export default function Scheduled() {
  const { assets, scheduledInvestments, setScheduledInvestments } = useAppStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [assetId, setAssetId] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [deletingItem, setDeletingItem] = useState<ScheduledInvestment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openModal() {
    setAssetId('')
    setAmount('')
    setFrequency('monthly')
    setNextDate(new Date().toISOString().split('T')[0])
    setError('')
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!assetId || !amount) {
      setError('Asset and amount are required')
      return
    }

    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('scheduled_investments')
      .insert({
        user_id: user.id,
        asset_id: assetId,
        amount: parseFloat(amount),
        frequency,
        next_date: nextDate,
        is_active: true,
      })
      .select('*, asset:assets(*)')
      .single()

    if (error) {
      setError('Error saving scheduled contribution')
      setIsLoading(false)
      return
    }

    setScheduledInvestments([...scheduledInvestments, data])
    setIsLoading(false)
    setIsModalOpen(false)
  }

  async function toggleActive(item: ScheduledInvestment) {
    const { data } = await supabase
      .from('scheduled_investments')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
      .select()
      .single()

    if (data) {
      setScheduledInvestments(scheduledInvestments.map(s => s.id === item.id ? data : s))
    }
  }

  async function handleDelete() {
    if (!deletingItem) return
    setIsDeleting(true)

    const { error } = await supabase
      .from('scheduled_investments')
      .delete()
      .eq('id', deletingItem.id)

    if (!error) {
      setScheduledInvestments(scheduledInvestments.filter(s => s.id !== deletingItem.id))
    }

    setDeletingItem(null)
    setIsDeleting(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Scheduled contributions</h1>
        <button
          onClick={openModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New scheduled
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
        {scheduledInvestments.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No scheduled contributions yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Asset</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Frequency</th>
                <th className="text-right text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Next date</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {scheduledInvestments.map(item => {
                const asset = assets.find(a => a.id === item.asset_id)
                return (
                  <tr key={item.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: asset?.color }} />
                        <span className="text-sm font-medium text-white">{asset?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {FREQUENCY_LABELS[item.frequency]}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white text-right">
                      €{item.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(item.next_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(item)}
                        className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                          item.is_active
                            ? 'bg-emerald-900 text-emerald-400 hover:bg-emerald-800'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="text-slate-400 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        Delete
                      </button>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-5">New scheduled contribution</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select an asset</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-1 block">Amount (€)</label>
                <input
                  type="number"
                  placeholder="200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-1 block">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {FREQUENCIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-1 block">First contribution date</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  {isLoading ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-2">Delete scheduled contribution?</h2>
            <p className="text-slate-400 text-sm mb-6">
              The scheduled contribution of <span className="text-white font-semibold">€{deletingItem.amount}</span> will be deleted. Already registered contributions will not be affected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingItem(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg transition-colors">
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
