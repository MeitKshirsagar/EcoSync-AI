import { useEffect, useState } from 'react'
import axios from 'axios'
import { Activity, Wifi, WifiOff, Settings as SettingsIcon, X, Eye, EyeOff } from 'lucide-react'
import UserPreferencesProvider, { usePreferences } from './context/UserPreferences'
import WelcomeSetup from './components/WelcomeSetup'
import PipelineProgress from './components/PipelineProgress'
import StrategyGauntlet from './components/StrategyGauntlet'
import VecmChart from './components/VecmChart'
import FocusAudit from './components/FocusAudit'
import ControllerPanel from './components/ControllerPanel'
import NewsFeed from './components/NewsFeed'
import TradingTerminal from './components/TradingTerminal'
import ErrorBoundary from './components/ErrorBoundary'
import { CardSkeleton, TableSkeleton } from './components/Skeleton'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import DataUploader from './components/DataUploader'
import Copilot from './components/Copilot'
import { MessageSquare } from 'lucide-react'

interface Stage {
  id: string
  label: string
  status: 'complete' | 'active' | 'pending'
}

interface Strategy {
  name: string
  description: string
  sector: string
  vikor_score: number
  rank: number
  criteria_labels: string[]
  criteria_scores: number[]
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { prefs, update, reset } = usePreferences()

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Name */}
        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Your Name</label>
        <input
          className="welcome-input mb-5"
          value={prefs.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="What should we call you?"
        />

        {/* Theme */}
        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Theme</label>
        <div className="theme-swatch-group">
          {(['midnight', 'ocean', 'forest'] as const).map((t) => (
            <button
              key={t}
              onClick={() => update({ theme: t })}
              className={`theme-swatch theme-swatch-${t} ${prefs.theme === t ? 'active' : ''}`}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1, 3)}
            </button>
          ))}
        </div>

        {/* Tips toggle */}
        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Help Tips</label>
        <button
          onClick={() => update({ showTips: !prefs.showTips })}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors mb-6"
        >
          {prefs.showTips ? <Eye size={16} className="text-cyan-400" /> : <EyeOff size={16} />}
          {prefs.showTips ? 'Tips are on — click ℹ icons for help' : 'Tips are hidden'}
        </button>

        {/* Data Upload */}
        <div className="mt-8 mb-6 border-t border-slate-700/50 pt-8">
          <DataUploader />
        </div>

        {/* Reset */}
        <button
          onClick={() => { reset(); onClose() }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Reset all preferences
        </button>
      </div>
    </div>
  )
}

function Dashboard() {
  const { prefs } = usePreferences()
  const { logout } = useAuth()
  const [healthy, setHealthy] = useState<boolean | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [dashLoading, setDashLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [healthRes, pipeRes, stratRes] = await Promise.allSettled([
          axios.get('/api/health'),
          axios.get('/api/pipeline/status'),
          axios.get('/api/strategies'),
        ])

        setHealthy(healthRes.status === 'fulfilled')

        if (pipeRes.status === 'fulfilled') {
          setStages(pipeRes.value.data.stages)
        } else {
          setStages([
            { id: 'analyst', label: 'Analyst', status: 'complete' },
            { id: 'auditor', label: 'Auditor', status: 'complete' },
            { id: 'jurist', label: 'Jurist', status: 'active' },
            { id: 'controller', label: 'Controller', status: 'pending' },
          ])
        }

        if (stratRes.status === 'fulfilled') {
          setStrategies(stratRes.value.data.strategies)
        }
      } finally {
        setDashLoading(false)
      }
    }

    fetchAll()
  }, [])

  const displayName = prefs.name || 'there'

  return (
    <div className="dashboard-shell">
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Activity size={28} className="text-[var(--accent)]" />
            Eco-Sync AI
          </h1>
          <p className="text-[0.9rem] text-slate-400 mt-2 leading-relaxed">
            {getGreeting()}, <span className="text-[var(--accent)] font-medium">{displayName}</span>! Here's your dashboard.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Health badge */}
          <div className="flex items-center gap-2 text-sm">
            {healthy === null ? (
              <span className="text-slate-500">Connecting…</span>
            ) : healthy ? (
              <>
                <span className="health-dot ok" />
                <Wifi size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-medium">Online</span>
              </>
            ) : (
              <>
                <span className="health-dot err" />
                <WifiOff size={14} className="text-red-400" />
                <span className="text-red-400 font-medium">Offline</span>
              </>
            )}
          </div>

          {/* Copilot */}
          <button
            onClick={() => setCopilotOpen(!copilotOpen)}
            className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2"
          >
            <MessageSquare size={14} />
            Ask Copilot
          </button>

          {/* Settings gear */}
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors text-xs font-bold text-slate-400 hover:text-red-400 tracking-wider uppercase ml-2"
          >
            Logout
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
            aria-label="Settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      {/* ── Pipeline (full-width) ────────────────────────────────────────── */}
      <PipelineProgress stages={stages} />

      {dashLoading ? (
        /* ── Skeleton placeholders ──────────────────────────────────────── */
        <>
          <div className="dashboard-grid">
            <div className="col-span-full lg:col-span-2">
              <TableSkeleton />
            </div>
            <div className="col-span-full lg:col-span-1">
              <CardSkeleton />
            </div>
          </div>
          <div className="dashboard-grid-half">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </>
      ) : (
        /* ── Loaded content ─────────────────────────────────────────────── */
        <>
          {/* ── Row 1: Strategies & Trading ──────────────────────────────── */}
          <div className="dashboard-grid">
            <div className="col-span-full lg:col-span-2">
              {strategies.length > 0 && <StrategyGauntlet strategies={strategies} />}
            </div>
            <div className="col-span-full lg:col-span-1">
              <TradingTerminal />
            </div>
          </div>

          {/* ── Row 2: Analysis & News ─────────────────────────────────── */}
          <div className="dashboard-grid">
            <div className="col-span-full lg:col-span-2">
              <VecmChart />
            </div>
            <div className="col-span-full lg:col-span-1">
              <NewsFeed />
            </div>
          </div>

          {/* ── Row 3: Audit & Controller ────────────────────────────────── */}
          <div className="dashboard-grid-half">
            <FocusAudit />
            <ControllerPanel />
          </div>
        </>
      )}

      {/* Copilot Sidebar */}
      <Copilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="text-center text-xs text-slate-600 mt-auto pb-6 pt-8">
        Eco-Sync AI v0.1.0 · All values in ₹ (INR) · Indian FY (Apr–Mar)
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <UserPreferencesProvider>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </UserPreferencesProvider>
    </AuthProvider>
  )
}

function AppInner() {
  const { prefs } = usePreferences()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Activity className="text-cyan-400 w-12 h-12 animate-pulse" />
      </div>
    )
  }

  if (!user) return <Login />
  if (!prefs.setupDone) return <WelcomeSetup />

  return <Dashboard />
}

