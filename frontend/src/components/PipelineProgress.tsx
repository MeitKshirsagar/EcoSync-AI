import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { CheckCircle, Loader, Clock, TrendingUp, ShieldCheck, Scale, Settings, Play, RotateCcw, AlertCircle } from 'lucide-react'
import InfoTip from './InfoTip'

interface Stage {
  id: string
  label: string
  status: 'complete' | 'active' | 'pending' | 'error'
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  analyst: <TrendingUp size={18} />,
  auditor: <ShieldCheck size={18} />,
  jurist: <Scale size={18} />,
  controller: <Settings size={18} />,
}

const FRIENDLY_LABELS: Record<string, string> = {
  analyst: 'Market Analyst',
  auditor: 'Spending Auditor',
  jurist: 'Strategy Ranker',
  controller: 'Health Checker',
}

const STATUS_DISPLAY: Record<string, { icon: React.ReactNode; label: string }> = {
  complete: { icon: <CheckCircle size={14} className="text-emerald-400" />, label: 'Done ✓' },
  active: { icon: <Loader size={14} className="text-cyan-400 animate-spin" />, label: 'Working…' },
  pending: { icon: <Clock size={14} className="text-slate-500" />, label: 'Up Next' },
  error: { icon: <AlertCircle size={14} className="text-red-400" />, label: 'Error' },
}

interface Props {
  stages: Stage[]
  onStagesUpdate?: (stages: Stage[]) => void
}

export default function PipelineProgress({ stages: initialStages, onStagesUpdate }: Props) {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [running, setRunning] = useState(false)

  // Sync from parent
  useEffect(() => {
    setStages(initialStages)
  }, [initialStages])

  // Auto-poll when pipeline is running
  useEffect(() => {
    if (!running) return
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('/api/pipeline/status')
        setStages(res.data.stages)
        onStagesUpdate?.(res.data.stages)
        if (!res.data.running) {
          setRunning(false)
        }
      } catch { /* ignore */ }
    }, 1000)
    return () => clearInterval(interval)
  }, [running, onStagesUpdate])

  const handleRun = useCallback(async () => {
    try {
      await axios.post('/api/pipeline/run')
      setRunning(true)
    } catch { /* ignore */ }
  }, [])

  const handleReset = useCallback(async () => {
    try {
      const res = await axios.post('/api/pipeline/reset')
      setStages(res.data.stages ?? initialStages)
      setRunning(false)
      onStagesUpdate?.(res.data.stages ?? initialStages)
    } catch { /* ignore */ }
  }, [initialStages, onStagesUpdate])

  const allComplete = stages.every((s) => s.status === 'complete')
  const allPending = stages.every((s) => s.status === 'pending')

  return (
    <section className="glass-card p-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <TrendingUp size={20} className="text-cyan-400" />
          Analysis Progress
          <InfoTip tip="Our AI agents work in stages — each one handles a different part of the analysis. Click 'Run Pipeline' to watch them execute in sequence." />
        </h2>
        <div className="flex items-center gap-2">
          {(allComplete || stages.some(s => s.status === 'error')) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={running}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${running
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
              }`}
          >
            {running ? (
              <><Loader size={12} className="animate-spin" /> Running…</>
            ) : (
              <><Play size={12} /> Run Pipeline</>
            )}
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        {running ? 'Agents are processing…' : allComplete ? 'All agents completed successfully!' : allPending ? 'Click Run Pipeline to start the analysis' : "Here's how far our AI agents have gotten"}
      </p>

      <div className="flex items-start">
        {stages.map((stage, i) => (
          <div key={stage.id} className="contents">
            {/* Node */}
            <div className="pipeline-node">
              <div className={`pipeline-dot ${stage.status}`}>
                {STAGE_ICONS[stage.id] ?? (i + 1)}
              </div>
              <span className="text-xs font-medium text-slate-300">
                {FRIENDLY_LABELS[stage.id] ?? stage.label}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 uppercase tracking-widest">
                {STATUS_DISPLAY[stage.status]?.icon}
                {STATUS_DISPLAY[stage.status]?.label ?? stage.status}
              </span>
            </div>

            {/* Connector */}
            {i < stages.length - 1 && (
              <div
                className={`pipeline-connector ${stage.status === 'complete' ? 'done' : 'upcoming'
                  }`}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
