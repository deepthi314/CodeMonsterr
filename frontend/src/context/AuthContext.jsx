import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.setToken(token);
            checkUser();
        } else {
            setLoading(false);
        }
    }, []);

    const checkUser = async () => {
        try {
            const res = await api.getMe();
            setUser(res);
        } catch (err) {
            localStorage.removeItem('token');
            api.setToken(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const res = await api.login(username, password);
        localStorage.setItem('token', res.access_token);
        api.setToken(res.access_token);
        await checkUser();
        return res;
    };

    const register = async (username, email, password) => {
        await api.register(username, email, password);
        return login(username, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        api.setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
