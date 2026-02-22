import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await register(formData.username, formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrength = () => {
        if (!formData.password) return 0;
        let score = 0;
        if (formData.password.length >= 8) score++;
        if (/[A-Z]/.test(formData.password)) score++;
        if (/[0-9]/.test(formData.password)) score++;
        if (/[^A-Za-z0-9]/.test(formData.password)) score++;
        return score;
    };

    const strength = getPasswordStrength();

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-dark-800 border border-dark-600 p-8 rounded-[32px] shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <span className="text-5xl block mb-4">🦖</span>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Join the Den</h2>
                    <p className="text-gray-500 text-sm">Create an account to start saving your traces</p>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-dark-900 border border-dark-600 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium"
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-dark-900 border border-dark-600 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-dark-900 border border-dark-600 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        {formData.password && (
                            <div className="flex gap-1 px-1 mt-2">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < strength ? (strength <= 2 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-dark-600'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-900/20 transform mt-4 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                    </button>
                </form>

                <p className="text-center mt-8 text-gray-500 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 font-bold hover:underline">
                        Login
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
