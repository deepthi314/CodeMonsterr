const API_BASE = '/api';

let authToken = localStorage.getItem('token');

const api = {
    setToken: (token) => {
        authToken = token;
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    },

    getHeaders: () => ({
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    }),

    // Auth
    register: async (username, email, password) => {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Registration failed');
        }
        return res.json();
    },

    login: async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
    },

    getMe: async () => {
        const res = await fetch(`${API_BASE}/users/me`, {
            headers: api.getHeaders(),
        });
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
    },

    // Trace
    traceCode: async (code, language) => {
        const res = await fetch(`${API_BASE}/trace`, {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify({ code, language }),
        });
        if (!res.ok) throw new Error('Trace failed');
        return res.json();
    },

    // AI Explain
    explainStep: async (step, language) => {
        const res = await fetch(`${API_BASE}/explain`, {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify({ step, language }),
        });
        if (!res.ok) throw new Error('Explanation failed');
        return res.json();
    },

    // History
    getHistory: async () => {
        const res = await fetch(`${API_BASE}/history`, {
            headers: api.getHeaders(),
        });
        return res.json();
    },

    saveHistory: async (traceData) => {
        const res = await fetch(`${API_BASE}/history`, {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify(traceData),
        });
        return res.json();
    },

    deleteHistory: async (id) => {
        await fetch(`${API_BASE}/history/${id}`, {
            method: 'DELETE',
            headers: api.getHeaders(),
        });
    },

    // Notes
    getNotes: async () => {
        const res = await fetch(`${API_BASE}/notes`, {
            headers: api.getHeaders(),
        });
        return res.json();
    },

    createNote: async (note) => {
        const res = await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify(note),
        });
        return res.json();
    },

    deleteNote: async (id) => {
        await fetch(`${API_BASE}/notes/${id}`, {
            method: 'DELETE',
            headers: api.getHeaders(),
        });
    },

    // Stats
    getStats: async () => {
        const res = await fetch(`${API_BASE}/stats`, {
            headers: api.getHeaders(),
        });
        return res.json();
    },
};

export const {
    setToken,
    register,
    login,
    getMe,
    traceCode,
    explainStep,
    getHistory,
    saveHistory,
    deleteHistory,
    getNotes,
    createNote,
    deleteNote,
    getStats,
} = api;

export default api;
