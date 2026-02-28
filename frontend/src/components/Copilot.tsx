import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export default function Copilot({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'assistant',
            content: "Hi! I'm your Eco-Sync Copilot. I'm monitoring your company dashboard. How can I help you optimize your strategies today?",
            timestamp: new Date().toISOString()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post('/api/chat', { message: userMsg.content });

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.reply,
                timestamp: response.data.timestamp
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I couldn't connect to the backend agent right now.",
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900/95 backdrop-blur-3xl border-l border-slate-700/60 shadow-2xl flex flex-col z-50 transform transition-transform duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60 bg-slate-800/40">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Bot size={24} className="text-cyan-400" />
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-100 tracking-wide">Copilot</h3>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Assistant</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-700 border border-slate-600/50 text-slate-300'
                            }`}>
                            {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`flex text-sm leading-relaxed max-w-[80%] ${msg.role === 'user'
                            ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-md'
                            : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 border border-slate-600/50 text-slate-400 flex items-center justify-center">
                            <Bot size={16} />
                        </div>
                        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-3 flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-cyan-400" />
                            <span className="text-sm font-medium text-slate-400 italic">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700/60 bg-slate-800/30">
                <form onSubmit={sendMessage} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything about your dashboard..."
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-4 pr-12 py-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium shadow-inner"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-md"
                    >
                        <Send size={16} className="ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
