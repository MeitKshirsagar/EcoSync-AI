import { useEffect, useState } from 'react'
import axios from 'axios'
import { PieChart, ShieldCheck, Leaf, Users, CreditCard, Activity } from 'lucide-react'
import InfoTip from './InfoTip'

interface AuditCategory {
    name: string
    total: string
    pct: number
    status: 'optimal' | 'investigate' | 'critical' | 'growth'
}

interface AuditDomain {
    id: string
    name: string
    score: number
    status: string
    description: string
    categories: AuditCategory[]
}

interface AuditData {
    financial_year: string
    currency: string
    domains: AuditDomain[]
}

const statusColors = {
    optimal: 'bg-emerald-400',
    investigate: 'bg-amber-400',
    critical: 'bg-red-400',
    growth: 'bg-cyan-400'
}

const domainIcons: Record<string, any> = {
    financial: <CreditCard size={18} />,
    regulatory: <ShieldCheck size={18} />,
    esg: <Leaf size={18} />,
    human: <Users size={18} />
}

export default function FocusAudit() {
    const [data, setData] = useState<AuditData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeDomain, setActiveDomain] = useState<string>('financial')

    useEffect(() => {
        axios
            .get('/api/auditor/focus')
            .then((r) => {
                setData(r.data)
                if (r.data.domains && r.data.domains.length > 0) {
                    setActiveDomain(r.data.domains[0].id)
                }
            })
            .catch(() => setData(null))
            .finally(() => setLoading(false))
    }, [])

    const currentDomain = data?.domains.find(d => d.id === activeDomain)

    return (
        <section className="glass-card p-6 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                        <Activity size={20} className="text-cyan-400" />
                        Integrity Audit
                        <InfoTip tip="Multi-pillar audit assessing Financial hygiene, Regulatory compliance, Sustainability, and Human Capital health. Use the tabs to switch between domains." />
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">
                        {data?.financial_year} · Multi-Domain Oversight
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="loading-spinner" />
                </div>
            ) : data ? (
                <>
                    {/* Domain Selection Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                        {data.domains.map((domain) => (
                            <button
                                key={domain.id}
                                onClick={() => setActiveDomain(domain.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shrink-0 ${activeDomain === domain.id
                                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_-5px_rgba(6,182,212,0.5)]'
                                        : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                            >
                                <span className={activeDomain === domain.id ? 'text-cyan-400' : 'text-slate-600'}>
                                    {domainIcons[domain.id]}
                                </span>
                                <span className="text-xs font-bold tracking-tight">{domain.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Active Domain Context */}
                    {currentDomain && (
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-2xl font-black font-mono ${currentDomain.score >= 90 ? 'text-emerald-400' :
                                                currentDomain.score >= 75 ? 'text-cyan-400' :
                                                    currentDomain.score >= 60 ? 'text-amber-400' : 'text-red-400'
                                            }`}>
                                            {currentDomain.score}
                                        </span>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-tighter">{currentDomain.status}</h3>
                                            <p className="text-[10px] text-slate-500 leading-tight max-w-[200px]">{currentDomain.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((segment) => (
                                        <div
                                            key={segment}
                                            className={`h-1.5 w-4 rounded-full ${(currentDomain.score / 20) >= segment
                                                    ? (currentDomain.score >= 90 ? 'bg-emerald-400' : 'bg-cyan-400')
                                                    : 'bg-slate-800'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Categories List */}
                            <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                {currentDomain.categories.map((cat, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[11px] font-semibold text-slate-300">{cat.name}</span>
                                            <span className="text-[11px] font-mono font-bold text-slate-400">{cat.total}</span>
                                        </div>
                                        <div className="score-bar-track h-1.5">
                                            <div
                                                className={`score-bar-fill ${statusColors[cat.status]}`}
                                                style={{ width: `${cat.pct * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                    Audit services currently unavailable
                </div>
            )}
        </section>
    )
}
