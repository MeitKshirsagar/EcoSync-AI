import { useState, type ReactNode } from 'react'
import { usePreferences } from '../context/UserPreferences'
import { Info, X } from 'lucide-react'

interface Props {
    tip: string
    children?: ReactNode
}

export default function InfoTip({ tip }: Props) {
    const { prefs } = usePreferences()
    const [open, setOpen] = useState(false)

    if (!prefs.showTips) return null

    return (
        <span className="info-tip-wrapper">
            <button
                className="info-tip-btn"
                onClick={() => setOpen(!open)}
                aria-label="What is this?"
            >
                {open ? <X size={13} /> : <Info size={13} />}
            </button>
            {open && (
                <div className="info-tip-bubble">
                    {tip}
                </div>
            )}
        </span>
    )
}
