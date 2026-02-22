import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Notes from './pages/Notes';
import Login from './pages/Login';
import Register from './pages/Register';
import TracerPage from './pages/TracerPage'; // We will create this from existing App logic

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<PrivateRoute />}>
                <Route element={
                    <div className="flex h-screen bg-dark-900 overflow-hidden font-inter text-gray-200">
                        <Sidebar />
                        <main className="flex-1 overflow-hidden relative">
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/tracer" element={<TracerPage />} />
                                <Route path="/history" element={<History />} />
                                <Route path="/notes" element={<Notes />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </main>
                    </div>
                }>
                    <Route path="/*" element={<div />} />
                </Route>
            </Route>
        </Routes>
    );
}
