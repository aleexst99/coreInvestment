import { useAppStore } from '../store/useAppStore'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const { assets, investments, assetValues } = useAppStore()

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)

  const totalCurrentValue = assets.reduce((sum, asset) => {
    const values = assetValues.filter(v => v.asset_id === asset.id)
    if (values.length === 0) return sum
    const latest = values.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    return sum + latest.value
  }, 0)

  const profit = totalCurrentValue - totalInvested
  const profitPercent = totalInvested > 0 ? ((profit / totalInvested) * 100).toFixed(2) : '0'
  const isPositive = profit >= 0

  const chartData = assets.map(asset => {
    const values = assetValues.filter(v => v.asset_id === asset.id)
    const latest = values.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    return {
      name: asset.name,
      value: latest?.value ?? 0,
      color: asset.color,
    }
  }).filter(d => d.value > 0)

  const assetRows = assets.map(asset => {
    const invested = investments
      .filter(inv => inv.asset_id === asset.id)
      .reduce((sum, inv) => sum + inv.amount, 0)

    const values = assetValues.filter(v => v.asset_id === asset.id)
    const latest = values.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    const currentValue = latest?.value ?? 0
    const assetProfit = currentValue - invested
    const assetProfitPercent = invested > 0 ? ((assetProfit / invested) * 100).toFixed(2) : '0'

    return { asset, invested, currentValue, assetProfit, assetProfitPercent }
  })

  const evolutionData = (() => {
    const dates = [...new Set(assetValues.map(v => v.date))].sort()

    return dates.map(date => {
      const total = assets.reduce((sum, asset) => {
        const valuesUpToDate = assetValues
          .filter(v => v.asset_id === asset.id && v.date <= date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return sum + (valuesUpToDate[0]?.value ?? 0)
      }, 0)

      return {
        date: new Date(date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        value: total,
      }
    })
  })()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400 mb-1">Total invested</p>
          <p className="text-2xl font-bold text-white">€{totalInvested.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400 mb-1">Current value</p>
          <p className="text-2xl font-bold text-white">€{totalCurrentValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400 mb-1">Return</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}€{profit.toLocaleString()} ({profitPercent}%)
          </p>
        </div>
      </div>

      {/* Evolution chart */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Portfolio evolution</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={evolutionData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v.toLocaleString()}`} />
            <Tooltip
              formatter={(value: number) => [`€${value.toLocaleString()}`, 'Total value']}
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
            />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution + assets */}
      <div className="grid grid-cols-2 gap-6">

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Allocation</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie cx="50%" cy="50%" innerRadius={65} outerRadius={100} dataKey="value" data={chartData}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`€${value.toLocaleString()}`, name]}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-4">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-slate-300">{entry.name}</span>
                <span className="ml-auto text-sm font-semibold text-white">
                  {((entry.value / totalCurrentValue) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Assets</h2>
          <div className="flex flex-col gap-4">
            {assetRows.map(({ asset, invested, currentValue, assetProfitPercent }) => (
              <div key={asset.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: asset.color }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{asset.name}</p>
                  <p className="text-xs text-slate-500">Invested: €{invested.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">€{currentValue.toLocaleString()}</p>
                  <p className={`text-xs font-medium ${Number(assetProfitPercent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(assetProfitPercent) >= 0 ? '+' : ''}{assetProfitPercent}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
