import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (!isLogin) {
                // Register
                await axios.post(`${API_BASE_URL}/api/register`, {
                    email,
                    password,
                    full_name: fullName || 'Eco-Sync User'
                });
            }

            // Login (happens automatically after register too)
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await axios.post(`${API_BASE_URL}/api/token`, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(response.data.access_token, response.data.user);
        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                'An error occurred. Please check your credentials and try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] relative overflow-hidden transition-colors duration-500">
            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-3xl opacity-50 mix-blend-screen" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl opacity-50 mix-blend-screen" />
            </div>

            <div className="w-full max-w-md z-10 relative">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-xl mb-5 backdrop-blur-md">
                        <Activity className="text-cyan-400 w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight text-slate-100 drop-shadow-sm">
                        Eco-Sync <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">AI</span>
                    </h1>
                    <p className="text-base text-slate-400 font-medium tracking-wide">
                        Enterprise Resilience Engine
                    </p>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold text-slate-200 uppercase tracking-widest">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-start gap-3 shadow-inner">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Company / Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                        placeholder="Acme Corp"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                    placeholder="admin@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
                            </button>
                        </div>

                        <div className="text-center pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                }}
                                className="text-sm text-slate-400 hover:text-cyan-400 font-bold transition-colors tracking-wide"
                            >
                                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
