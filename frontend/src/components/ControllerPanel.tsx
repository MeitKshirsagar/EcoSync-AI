import { useEffect, useState } from 'react'
import axios from 'axios'
import { HeartPulse, CheckCircle2, AlertTriangle } from 'lucide-react'
import InfoTip from './InfoTip'

interface Check {
    value: string
    threshold: string
    passed: boolean
}

interface Validation {
    strategy: string
    financial_year: string
    currency: string
    checks: Record<string, Check>
    passed: number
    total: number
    verdict: 'PASS' | 'FAIL'
    score: number
}

export default function ControllerPanel() {
    const [validations, setValidations] = useState<Validation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios
            .get('/api/controller/validate')
            .then((r) => setValidations(r.data.validations))
            .catch(() => setValidations([]))
            .finally(() => setLoading(false))
    }, [])

    const healthyCount = validations.filter((v) => v.verdict === 'PASS').length

    return (
        <section className="glass-card p-8 sm:p-10 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 tracking-tight flex items-center gap-3">
                <HeartPulse size={22} className="text-cyan-400" />
                Business Health Check
                <InfoTip tip="Each strategy is tested against key financial criteria like customer cost, lifetime value, and profit margins. 'Healthy' means it passes all checks; 'Needs Attention' means some criteria didn't meet the threshold." />
            </h2>
            <p className="text-base text-slate-400 mb-8">Do these strategies make financial sense?</p>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="loading-spinner" />
                </div>
            ) : validations.length > 0 ? (
                <div className="flex-1 flex flex-col gap-4">
                    {/* Summary ring */}
                    <div className="flex items-center gap-6 p-8 mb-6 rounded-2xl bg-slate-800/40 border border-slate-700/40 shadow-md isolate">
                        <div className="flex-1">
                            <div className="text-sm text-slate-400 font-bold uppercase tracking-widest pl-2 mb-3">Healthy Strategies</div>
                            <div className="text-4xl font-black text-emerald-400 pl-2">
                                {healthyCount}
                                <span className="text-lg text-slate-500 font-medium tracking-wide"> out of {validations.length}</span>
                            </div>
                        </div>
                        <div className="w-20 h-20 relative">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="4" />
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="15.5"
                                    fill="none"
                                    stroke="var(--success)"
                                    strokeWidth="4"
                                    strokeDasharray={`${validations.length > 0 ? (healthyCount / validations.length) * 97.4 : 0} 97.4`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-100">
                                {validations.length > 0 ? Math.round((healthyCount / validations.length) * 100) : 0}%
                            </span>
                        </div>
                    </div>

                    {/* Validation list */}
                    <div className="space-y-5 overflow-y-auto pr-3 custom-scrollbar flex-1">
                        {validations.map((v, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-5 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/40 shadow-sm hover:border-slate-700/60 hover:bg-slate-800/40 transition-all"
                            >
                                <div className="p-2 bg-slate-900/50 rounded-full shrink-0">
                                    {v.verdict === 'PASS' ? (
                                        <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0" />
                                    ) : (
                                        <AlertTriangle size={22} className="text-amber-400 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <span className="text-lg font-bold text-slate-100 truncate block">{v.strategy}</span>
                                    <div className="flex gap-4 mt-2 mb-1 text-sm font-semibold tracking-wide text-slate-400">
                                        <span>{v.passed} of {v.total} criteria met</span>
                                        <span className={v.verdict === 'PASS' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'}>
                                            {v.verdict === 'PASS' ? 'Healthy ✓' : 'Needs Attention ⚠'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                    No health check data available
                </div>
            )}
        </section>
    )
}
