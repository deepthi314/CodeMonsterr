import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const History = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await api.getHistory();
            setHistory(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Are you sure?')) return;
        await api.deleteHistory(id);
        loadHistory();
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Trace History</h1>
                    <p className="text-gray-500 font-medium">Revisit and analyze your previous execution sessions.</p>
                </div>
                <div className="bg-dark-800 border border-dark-600 px-4 py-2 rounded-xl text-xs font-bold text-gray-400">
                    {history.length} SAVED SESSIONS
                </div>
            </header>

            {loading ? (
                <div className="flex animate-pulse flex-col gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-dark-800 rounded-3xl" />)}
                </div>
            ) : history.length > 0 ? (
                <div className="grid gap-4">
                    {history.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-dark-800 border border-dark-600 p-6 rounded-[24px] flex items-center gap-6 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                        >
                            <div className="w-14 h-14 bg-dark-900 rounded-2xl flex items-center justify-center text-xl border border-dark-600 group-hover:bg-blue-600/10 transition-colors">
                                {item.language === 'python' ? '🐍' : item.language === 'javascript' ? 'js' : '☕'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-white font-bold truncate">Trace Session #{item.id}</h3>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-dark-900 text-gray-500 border border-dark-600 rounded-md">
                                        {item.language}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-xs truncate font-mono bg-dark-900/50 p-1.5 rounded-lg border border-dark-700/50">
                                    {item.code.substring(0, 80)}...
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate('/tracer', { state: { code: item.code, language: item.language } })}
                                        className="p-2 bg-dark-900 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg border border-dark-600 transition-all"
                                    >
                                        👁
                                    </button>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="p-2 bg-dark-900 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg border border-dark-600 transition-all"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-dark-800/50 border-2 border-dashed border-dark-600 rounded-[32px]">
                    <span className="text-6xl block mb-6 grayscale opacity-20">🕒</span>
                    <h3 className="text-xl font-bold text-gray-500 mb-2">No history found</h3>
                    <p className="text-gray-600 text-sm">Your code traces will appear here once you save them.</p>
                </div>
            )}
        </div>
    );
};

export default History;
