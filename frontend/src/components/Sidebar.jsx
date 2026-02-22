import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', icon: '📊', path: '/' },
        { name: 'Tracer', icon: '🦖', path: '/tracer' },
        { name: 'History', icon: '🕒', path: '/history' },
        { name: 'Notes', icon: '📝', path: '/notes' },
    ];

    return (
        <div className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col h-screen">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-3xl">🦖</span>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">CodeMonster</h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Overhaul 1.0</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                    : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
                                }`
                            }
                        >
                            <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-dark-600">
                {user ? (
                    <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-600">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg border-2 border-dark-700 shadow-lg">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full py-2 bg-dark-700 hover:bg-red-900/20 hover:text-red-400 text-gray-400 text-xs font-bold rounded-lg transition-all border border-dark-600"
                        >
                            LOGOUT
                        </button>
                    </div>
                ) : (
                    <NavLink
                        to="/login"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                    >
                        SIGN IN
                    </NavLink>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
