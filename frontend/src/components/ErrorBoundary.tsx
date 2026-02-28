import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallbackTitle?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-fallback">
                    <AlertTriangle size={48} className="text-amber-400" />
                    <h2 className="text-xl font-semibold mt-4">
                        {this.props.fallbackTitle ?? 'Something went wrong'}
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 max-w-sm text-center leading-relaxed">
                        An unexpected error occurred. Try refreshing this section or reloading the page.
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-white hover:border-cyan-700 transition-colors"
                    >
                        <RefreshCw size={14} />
                        Try Again
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
