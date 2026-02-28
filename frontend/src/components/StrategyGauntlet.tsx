import React, { useState } from 'react';
import { Trophy, ArrowUpRight, ArrowDownRight, Minus, Play } from 'lucide-react'
import InfoTip from './InfoTip'
import axios from 'axios';

interface Strategy {
  name: string
  description: string
  sector: string
  vikor_score: number
  rank: number
  criteria_scores: number[]
}

const SECTOR_COLORS: Record<string, string> = {
  Retail: 'bg-violet-500/20 text-violet-300',
  Manufacturing: 'bg-amber-500/20 text-amber-300',
  'E-Commerce': 'bg-cyan-500/20 text-cyan-300',
  Trade: 'bg-green-500/20 text-green-300',
  Energy: 'bg-orange-500/20 text-orange-300',
}

function strengthLabel(score: number): { text: string; color: string } {
  if (score < 0.3) return { text: 'Strongest', color: 'text-emerald-400' }
  if (score < 0.5) return { text: 'Strong', color: 'text-cyan-400' }
  if (score < 0.7) return { text: 'Moderate', color: 'text-amber-400' }
  return { text: 'Weak', color: 'text-red-400' }
}

function strengthBarColor(score: number): string {
  if (score < 0.3) return 'bg-emerald-400'
  if (score < 0.6) return 'bg-cyan-400'
  if (score < 0.8) return 'bg-amber-400'
  return 'bg-red-400'
}

function trendIcon(rank: number) {
  if (rank <= 2) return <ArrowUpRight size={14} className="text-emerald-400" />
  if (rank >= 4) return <ArrowDownRight size={14} className="text-red-400" />
  return <Minus size={14} className="text-slate-500" />
}

export default function StrategyGauntlet({ strategies }: { strategies: Strategy[] }) {
  const [executingIdx, setExecutingIdx] = useState<number | null>(null);

  const executeStrategy = async (strategy: Strategy, idx: number) => {
    setExecutingIdx(idx);
    try {
      // Mocking a ticker symbol mapping based on the strategy sector
      const symbolMap: Record<string, string> = {
        'Retail': 'RELIANCE',
        'Technology': 'TCS',
        'Energy': 'ONGC',
        'Finance': 'HDFCBANK'
      };
      const ticker = symbolMap[strategy.sector] || 'NIFTY50';

      await axios.post('/api/trades', {
        symbol: ticker,
        quantity: Math.floor(Math.random() * 100) + 10,
        type: 'BUY'
      });

      // To provide visual feedback without full reload dependency
      setTimeout(() => setExecutingIdx(null), 1000);
    } catch (error) {
      console.error("Failed to execute strategy", error);
      setExecutingIdx(null);
    }
  };

  return (
    <section className="glass-card p-10">
      <h2 className="text-xl font-bold mb-2 tracking-tight flex items-center gap-3">
        <Trophy size={22} className="text-cyan-400" />
        Top Strategies
        <InfoTip tip="We ranked your business strategies from strongest to weakest. A lower score means a more resilient strategy. The ranking considers multiple factors like cost, risk, and growth potential." />
      </h2>
      <p className="text-base text-slate-400 mb-8">Your best business strategies, ranked by strength</p>

      <div className="space-y-5">
        {strategies.map((s, idx) => {
          const strength = strengthLabel(s.vikor_score)
          return (
            <div
              key={s.name}
              className="flex items-center gap-6 p-6 px-8 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-cyan-800/40 transition-colors hover:shadow-lg hover:shadow-cyan-900/10"
            >
              {/* Rank badge */}
              <div className={`rank-badge rank-${s.rank} w-10 h-10 text-base shadow-sm`}>{s.rank}</div>

              {/* Info */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-base truncate text-slate-100">{s.name}</span>
                  {trendIcon(s.rank)}
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm ${SECTOR_COLORS[s.sector] ?? 'bg-slate-600/30 text-slate-400'
                      }`}
                  >
                    {s.sector}
                  </span>
                </div>
                <p className="text-sm text-slate-400 truncate tracking-wide">{s.description}</p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => executeStrategy(s, idx)}
                    disabled={executingIdx === idx}
                    className="flex-1 bg-gradient-to-r flex items-center justify-center gap-2 from-emerald-500 to-cyan-500 text-slate-900 font-black uppercase tracking-widest py-3 rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executingIdx === idx ? 'Executing...' : (
                      <>
                        <Play size={16} className="fill-slate-900" />
                        Execute
                      </>
                    )}
                  </button>
                  <button className="px-6 py-3 rounded-xl border border-slate-700/60 text-slate-300 font-bold hover:bg-slate-800 transition-colors shadow-sm">
                    Details
                  </button>
                </div>
              </div>

              {/* Strength score */}
              <div className="w-52 flex-shrink-0 pl-6 border-l border-slate-700/50">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className={`font-bold uppercase tracking-wider ${strength.color}`}>{strength.text}</span>
                  <span className="font-mono font-black text-slate-200 text-sm">{((1 - s.vikor_score) * 100).toFixed(0)}%</span>
                </div>
                <div className="score-bar-track h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`score-bar-fill ${strengthBarColor(s.vikor_score)}`}
                    style={{ width: `${Math.max(5, (1 - s.vikor_score) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
