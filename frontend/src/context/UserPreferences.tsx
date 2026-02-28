import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type ThemeName = 'midnight' | 'ocean' | 'forest'

export interface Preferences {
    name: string
    theme: ThemeName
    showTips: boolean
    setupDone: boolean
}

const DEFAULT: Preferences = {
    name: '',
    theme: 'midnight',
    showTips: true,
    setupDone: false,
}

const STORAGE_KEY = 'ecosync_prefs'

interface ContextValue {
    prefs: Preferences
    update: (patch: Partial<Preferences>) => void
    reset: () => void
}

const Ctx = createContext<ContextValue>({
    prefs: DEFAULT,
    update: () => { },
    reset: () => { },
})

export function usePreferences() {
    return useContext(Ctx)
}

function load(): Preferences {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return { ...DEFAULT, ...JSON.parse(raw) }
    } catch { /* ignore */ }
    return DEFAULT
}

function save(p: Preferences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export default function UserPreferencesProvider({ children }: { children: ReactNode }) {
    const [prefs, setPrefs] = useState<Preferences>(load)

    // Apply theme class on <html>
    useEffect(() => {
        document.documentElement.className = `theme-${prefs.theme}`
    }, [prefs.theme])

    const update = (patch: Partial<Preferences>) => {
        setPrefs((prev) => {
            const next = { ...prev, ...patch }
            save(next)
            return next
        })
    }

    const reset = () => {
        localStorage.removeItem(STORAGE_KEY)
        setPrefs(DEFAULT)
    }

    return <Ctx.Provider value={{ prefs, update, reset }}>{children}</Ctx.Provider>
}
