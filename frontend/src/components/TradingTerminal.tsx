import { useEffect, useState } from 'react'
import axios from 'axios'
import { Wallet, Landmark, RefreshCcw } from 'lucide-react'
import InfoTip from './InfoTip'

interface Trade {
    symbol: string
    quantity: number
    type: 'BUY' | 'SELL'
    timestamp: string
}

export default function TradingTerminal() {
    const [trades, setTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)
    const [isLive, setIsLive] = useState(false)

    const fetchTrades = async () => {
        try {
            setLoading(true)
            const res = await axios.get('/api/trades')
            setTrades(res.data)
            setIsLive(true)
        } catch (err) {
            console.error('Failed to fetch trades', err)
            setIsLive(false)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTrades()
        const interval = setInterval(fetchTrades, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="glass-card p-8 sm:p-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8 gap-4">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                    <Landmark size={22} className="text-[var(--accent)]" />
                    Trading Terminal
                    <InfoTip tip="Observe trades executed by AI agents in Archestra. This terminal automatically syncs every 5 seconds to show real-time portfolio changes." />
                </h2>

                <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all shadow-sm ${isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
                    {isLive ? 'Live Sync' : 'Offline'}
                </div>
            </div>

            {loading && trades.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic">
                    Syncing with Archestra...
                </div>
            ) : trades.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800/80 m-2">
                    <div className="p-4 bg-slate-800/50 rounded-full mb-4 text-slate-500 shadow-inner">
                        <Wallet size={28} />
                    </div>
                    <p className="text-base text-slate-300 font-semibold tracking-wide">No active holdings</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-[220px] leading-relaxed">
                        Trades executed via Archestra will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-400 border-b border-slate-700/60 sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                            <tr>
                                <th className="pb-4 font-bold uppercase tracking-widest text-xs">Ticker</th>
                                <th className="pb-4 font-bold uppercase tracking-widest text-xs">Type</th>
                                <th className="pb-4 font-bold uppercase tracking-widest text-xs text-right">Quantity</th>
                                <th className="pb-4 font-bold uppercase tracking-widest text-xs text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {[...trades].reverse().map((trade, idx) => (
                                <tr key={idx} className="group hover:bg-slate-800/40 transition-colors">
                                    <td className="py-4 font-black text-slate-100 text-base">{trade.symbol}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase shadow-sm ${trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                            }`}>
                                            {trade.type}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right font-mono font-bold text-slate-200 text-base">{trade.quantity}</td>
                                    <td className="py-4 text-right text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                                        {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-800/60">
                <button
                    onClick={fetchTrades}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sm font-bold text-slate-300 transition-all active:scale-95 shadow-sm hover:shadow-md"
                >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    Manual Refresh
                </button>
            </div>
        </section>
    )
}
