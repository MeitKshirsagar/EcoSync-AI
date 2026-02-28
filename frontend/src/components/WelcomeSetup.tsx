import { useState } from 'react'
import { usePreferences } from '../context/UserPreferences'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function WelcomeSetup() {
    const { update } = usePreferences()
    const [name, setName] = useState('')

    const finish = () => {
        update({ name: name.trim() || 'there', setupDone: true, showTips: true })
    }

    return (
        <div className="welcome-backdrop">
            <div className="welcome-card">
                {/* Icon */}
                <div className="welcome-icon-ring">
                    <Sparkles size={36} />
                </div>

                <h1 className="text-3xl font-bold tracking-tight" style={{ marginTop: '40px', marginBottom: '20px' }}>
                    Welcome to Eco-Sync AI
                </h1>

                <p className="text-base text-slate-400 text-center" style={{ lineHeight: '1.9', maxWidth: '380px' }}>
                    Your personal AI-powered dashboard that analyses business strategies,
                    tracks spending, and checks market health — all explained in plain English.
                </p>

                {/* Divider */}
                <div style={{ width: '64px', height: '2px', background: 'linear-gradient(90deg, transparent, var(--text-muted), transparent)', opacity: 0.4, marginTop: '48px', marginBottom: '48px' }} />

                {/* Name */}
                <div className="w-full" style={{ marginBottom: '40px' }}>
                    <label className="welcome-label">What should we call you?</label>
                    <input
                        className="welcome-input"
                        type="text"
                        placeholder="e.g. Priya, Rahul, Team Lead…"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Actions */}
                <button className="welcome-btn" onClick={finish}>
                    Get Started <ArrowRight size={18} />
                </button>
                <button
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    style={{ marginTop: '20px' }}
                    onClick={() => update({ setupDone: true })}
                >
                    Skip for now
                </button>
            </div>
        </div>
    )
}
