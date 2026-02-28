import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart3, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import InfoTip from './InfoTip'

interface VecmResult {
    trace_stat: number[]
    crit_values_95: number[]
    eigen_stat: number[]
    cointegration_detected: boolean
    observations: number
    interpretation: string
    error?: string
}

interface PrometheeResult {
    net_flows: number[]
    strategy_names: string[]
    note: string
    error?: string
}

export default function VecmChart() {
    const [data, setData] = useState<VecmResult | null>(null)
    const [promData, setPromData] = useState<PrometheeResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [showDetails, setShowDetails] = useState(false)
    const [showPromethee, setShowPromethee] = useState(false)

    useEffect(() => {
        Promise.allSettled([
            axios.get('/api/analyst/vecm'),
            axios.get('/api/analyst/promethee'),
        ]).then(([vecmRes, promRes]) => {
            if (vecmRes.status === 'fulfilled') setData(vecmRes.value.data)
            if (promRes.status === 'fulfilled') setPromData(promRes.value.data)
        }).finally(() => setLoading(false))
    }, [])

    return (
        <section className="glass-card p-8 sm:p-10 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 tracking-tight flex items-center gap-3">
                <BarChart3 size={22} className="text-cyan-400" />
                Market &amp; Inflation Link
                <InfoTip tip="This checks whether the stock market (Nifty 50) and consumer prices (CPI) tend to move together. If they do, your strategies need to account for this connection." />
            </h2>
            <p className="text-base text-slate-400 mb-8">Are the stock market and inflation moving together?</p>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="loading-spinner" />
                </div>
            ) : data && !data.error ? (
                <div className="flex-1 flex flex-col gap-4">
                    {/* Main verdict */}
                    <div className={`p-8 rounded-2xl border shadow-inner ${data.cointegration_detected
                        ? 'bg-emerald-900/20 border-emerald-700/40'
                        : 'bg-amber-900/20 border-amber-700/40'
                        }`}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`text-3xl font-black tracking-tight ${data.cointegration_detected ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                {data.cointegration_detected ? "Yes, they're linked" : 'No clear link found'}
                            </span>
                        </div>
                        <p className="text-base text-slate-300 leading-relaxed font-semibold tracking-wide">{data.interpretation}</p>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-6 mt-2">
                        <div className="stat-tile bg-slate-800/40 border-slate-700/50 p-5 rounded-xl">
                            <span className="stat-label">Data Points Analysed</span>
                            <span className="stat-value text-cyan-400">{data.observations}</span>
                        </div>
                        <div className="stat-tile bg-slate-800/40 border-slate-700/50 p-5 rounded-xl">
                            <span className="stat-label">Connection Detected?</span>
                            <span className={`stat-value font-bold tracking-wider ${data.cointegration_detected ? 'text-emerald-400' : 'text-red-400'}`}>
                                {data.cointegration_detected ? 'Yes ✓' : 'No ✗'}
                            </span>
                        </div>
                    </div>

                    {/* PROMETHEE II Outranking */}
                    {promData && !promData.error && (
                        <>
                            <button
                                onClick={() => setShowPromethee(!showPromethee)}
                                className="flex items-center justify-between w-full p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors mt-2"
                            >
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                    <TrendingUp size={16} className="text-cyan-400" />
                                    Strategy Preference Analysis
                                </span>
                                {showPromethee ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                            </button>

                            {showPromethee && (
                                <div className="flex flex-col gap-3 p-5 mt-2 rounded-xl bg-slate-900/40 border border-slate-800 shadow-inner">
                                    <p className="text-sm text-slate-400 font-medium mb-2 leading-relaxed">{promData.note}</p>
                                    {promData.strategy_names.map((name, i) => {
                                        const flow = promData.net_flows[i]
                                        const maxFlow = Math.max(...promData.net_flows.map(Math.abs))
                                        const widthPct = maxFlow > 0 ? Math.abs(flow) / maxFlow * 100 : 0
                                        return (
                                            <div key={name} className="flex items-center gap-4">
                                                <span className="text-sm font-semibold text-slate-300 w-40 shrink-0 truncate" title={name}>{name}</span>
                                                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${flow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                        style={{ width: `${widthPct}%` }}
                                                    />
                                                </div>
                                                <span className={`text-sm font-black font-mono w-16 text-right ${flow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {flow >= 0 ? '+' : ''}{flow.toFixed(3)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* Expandable technical details */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
                    >
                        {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showDetails ? 'Hide' : 'Show'} technical details
                    </button>

                    {showDetails && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {data.trace_stat.map((ts, i) => (
                                <div className="stat-tile" key={`t-${i}`}>
                                    <span className="stat-label">Trace Stat r≤{i}</span>
                                    <span className="stat-value text-amber-400 !text-sm">{ts.toFixed(4)}</span>
                                </div>
                            ))}
                            {data.crit_values_95.map((cv, i) => (
                                <div className="stat-tile" key={`c-${i}`}>
                                    <span className="stat-label">Critical 95% r≤{i}</span>
                                    <span className="stat-value text-violet-400 !text-sm">{cv.toFixed(4)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                    {data?.error ?? 'Could not load market analysis data'}
                </div>
            )}
        </section>
    )
}

