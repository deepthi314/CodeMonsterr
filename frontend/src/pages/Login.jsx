import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-dark-800 border border-dark-600 p-8 rounded-[32px] shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <span className="text-5xl block mb-4">🦖</span>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome Back</h2>
                    <p className="text-gray-500 text-sm">Sign in to continue your code tracing journey</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-2xl text-sm mb-6 text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-dark-900 border border-dark-600 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-dark-900 border border-dark-600 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>
                </form>

                <p className="text-center mt-8 text-gray-500 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-400 font-bold hover:underline">
                        Register Now
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
