import { useEffect, useState } from 'react'
import axios from 'axios'
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import InfoTip from './InfoTip'

interface NewsItem {
    title: string
    summary: string
    source: string
    overall_sentiment_label: string
    overall_sentiment_score: number
    url: string
}

export default function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await axios.get('/api/news')
                setNews(res.data.feed)
            } catch (err) {
                console.error('Failed to fetch news', err)
            } finally {
                setLoading(false)
            }
        }
        fetchNews()
    }, [])

    const getSentimentIcon = (label: string) => {
        switch (label.toLowerCase()) {
            case 'bullish': return <TrendingUp size={14} className="text-emerald-400" />
            case 'bearish': return <TrendingDown size={14} className="text-red-400" />
            default: return <Minus size={14} className="text-slate-500" />
        }
    }

    const getSentimentColor = (label: string) => {
        switch (label.toLowerCase()) {
            case 'bullish': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            case 'bearish': return 'bg-red-500/10 text-red-400 border-red-500/20'
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }
    }

    return (
        <section className="glass-card p-8 sm:p-10 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6 tracking-tight flex items-center gap-3">
                <Newspaper size={22} className="text-cyan-400" />
                Market & Inflation News
                <InfoTip tip="Real-time financial news and sentiment analysis for the Indian market, sourced via Alpha Vantage. This helps contextualize the VECM and Strategy models." />
            </h2>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-lg italic tracking-wide">
                    Fetching latest insights...
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-5">
                    {news.map((item, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 transition-all group shadow-sm">
                            <div className="flex justify-between items-center mb-4 gap-4">
                                <span className={`text-sm px-4 py-1.5 rounded-md border font-bold uppercase tracking-widest flex items-center gap-2 shrink-0 shadow-sm ${getSentimentColor(item.overall_sentiment_label)}`}>
                                    {getSentimentIcon(item.overall_sentiment_label)}
                                    {item.overall_sentiment_label}
                                </span>
                                <span className="text-xs text-slate-400 font-mono font-bold tracking-widest uppercase">{item.source}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-100 leading-snug group-hover:text-cyan-300 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-400 mt-4 line-clamp-3 leading-relaxed tracking-wide font-medium">
                                {item.summary}
                            </p>
                            <a
                                href={item.url}
                                className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 mt-5 font-black uppercase tracking-widest transition-colors shadow-sm"
                            >
                                Read more <ExternalLink size={14} strokeWidth={3} />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
