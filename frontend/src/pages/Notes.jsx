import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '', color: '#3b82f6' });

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const data = await api.getNotes();
            setNotes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        await api.createNote(newNote);
        setNewNote({ title: '', content: '', color: '#3b82f6' });
        setIsCreating(false);
        loadNotes();
    };

    const deleteNote = async (id) => {
        await api.deleteNote(id);
        loadNotes();
    };

    const colors = [
        { name: 'Blue', hex: '#3b82f6' },
        { name: 'Purple', hex: '#a855f7' },
        { name: 'Red', hex: '#ef4444' },
        { name: 'Green', hex: '#22c55e' },
        { name: 'Yellow', hex: '#eab308' },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Code Notes</h1>
                    <p className="text-gray-500 font-medium">Keep track of algorithms and logic patterns.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-white hover:bg-gray-200 text-dark-900 px-6 py-3 rounded-2xl font-black shadow-xl transition-all active:scale-95"
                >
                    + NEW NOTE
                </button>
            </header>

            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.form
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            onSubmit={handleCreate}
                            className="bg-dark-800 border border-dark-600 p-8 rounded-[32px] w-full max-w-lg shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Create New Note</h2>
                            <input
                                type="text"
                                placeholder="Note Title"
                                required
                                className="w-full bg-dark-900 border border-dark-600 text-white p-4 rounded-xl mb-4 focus:outline-none focus:border-blue-500 transition-all font-bold"
                                value={newNote.title}
                                onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Algorithm logic, complexities, or general thoughts..."
                                required
                                className="w-full bg-dark-900 border border-dark-600 text-white p-4 rounded-xl mb-6 h-40 focus:outline-none focus:border-blue-500 transition-all"
                                value={newNote.content}
                                onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                            />

                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    {colors.map(c => (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${newNote.color === c.hex ? 'border-white scale-125' : 'border-transparent'}`}
                                            style={{ backgroundColor: c.hex }}
                                            onClick={() => setNewNote({ ...newNote, color: c.hex })}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="text-gray-400 font-bold px-4"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                                    >
                                        Save Note
                                    </button>
                                </div>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-dark-800 rounded-[32px]" />)}
                </div>
            ) : notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-dark-800 border border-dark-600 p-6 rounded-[32px] group relative overflow-hidden flex flex-col min-h-[240px]"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => deleteNote(note.id)}
                                    className="p-1.5 bg-red-900/20 text-red-400 rounded-lg border border-red-800/30"
                                >
                                    🗑
                                </button>
                            </div>
                            <div className="w-2 h-12 rounded-full mb-4" style={{ backgroundColor: note.color }} />
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{note.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap flex-1">
                                {note.content}
                            </p>
                            <div className="mt-6 pt-4 border-t border-dark-600 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-600">
                                <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                <span>Note #{note.id}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-dark-800/50 border-2 border-dashed border-dark-600 rounded-[32px]">
                    <span className="text-6xl block mb-6 grayscale opacity-20">📝</span>
                    <h3 className="text-xl font-bold text-gray-500 mb-2">No notes found</h3>
                    <p className="text-gray-600 text-sm">Organize your technical thoughts and snippets here.</p>
                </div>
            )}
        </div>
    );
};

export default Notes;
