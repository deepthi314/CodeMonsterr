import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalTraces: 0, totalNotes: 0, languageBreakdown: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.getStats();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { name: 'Total Traces', value: stats.totalTraces, icon: '🔥', color: 'blue' },
        { name: 'Saved Notes', value: stats.totalNotes, icon: '📝', color: 'indigo' },
        { name: 'Languages Used', value: Object.keys(stats.languageBreakdown).length, icon: '🚀', color: 'purple' },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                    Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.username}</span>
                </h1>
                <p className="text-gray-500 font-medium">Here's what's happening with your projects today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-dark-800 border border-dark-600 p-6 rounded-[24px] shadow-xl hover:border-blue-500/30 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl bg-dark-900 w-12 h-12 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                                {stat.icon}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1 bg-dark-900 rounded-lg">Realtime</span>
                        </div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">{stat.name}</h3>
                        <p className="text-4xl font-black text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-dark-800 border border-dark-600 rounded-[32px] p-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full" />
                        Language Mastery
                    </h2>
                    <div className="space-y-6">
                        {Object.entries(stats.languageBreakdown).length > 0 ? (
                            Object.entries(stats.languageBreakdown).map(([lang, count]) => (
                                <div key={lang}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">{lang}</span>
                                        <span className="text-xs text-blue-400 font-black">{Math.round((count / stats.totalTraces) * 100)}%</span>
                                    </div>
                                    <div className="h-3 bg-dark-900 rounded-full overflow-hidden border border-dark-600">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / stats.totalTraces) * 100}%` }}
                                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-600 italic">No traces saved yet. Start coding to see stats!</div>
                        )}
                    </div>
                </div>

                <div className="bg-dark-800 border border-dark-600 rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-dark-900 rounded-[28px] flex items-center justify-center text-4xl mb-6 border border-dark-600">
                        ✨
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Trace?</h3>
                    <p className="text-gray-500 text-sm mb-8 max-w-sm">Explore your code execution line by line with our advanced proprietary engine.</p>
                    <button
                        onClick={() => navigate('/tracer')}
                        className="px-8 py-4 bg-white text-dark-900 font-bold rounded-2xl hover:bg-gray-200 transition-all shadow-xl shadow-white/5 active:scale-95"
                    >
                        START NEW TRACE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
