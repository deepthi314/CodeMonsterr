import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Timeline = ({ steps, currentStep, onSelectStep, language }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const activeEl = containerRef.current?.querySelector('.active-step');
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentStep]);

    return (
        <div className="flex flex-col h-full bg-dark-900/40" ref={containerRef}>
            <div className="p-6 border-b border-dark-600">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Execution Pulse</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 relative">
                {/* The connecting line */}
                <div className="absolute left-[31px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-600/50 via-dark-600 to-transparent" />

                <div className="space-y-6">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isPast = index < currentStep;

                        return (
                            <motion.div
                                key={index}
                                onClick={() => onSelectStep(index)}
                                className={`relative pl-12 cursor-pointer group transition-all ${isActive ? 'active-step' : ''}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                {/* Step Connector Dot */}
                                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 z-10 transition-all duration-300 ${isActive
                                        ? 'bg-blue-500 border-white scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                        : isPast ? 'bg-blue-600/30 border-blue-500/50' : 'bg-dark-800 border-dark-600'
                                    }`} />

                                <div className={`p-4 rounded-2xl border transition-all duration-200 ${isActive
                                        ? 'bg-dark-800 border-blue-500/50 shadow-xl shadow-blue-900/10'
                                        : 'bg-transparent border-transparent hover:bg-dark-800/40 hover:border-dark-700'
                                    }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>
                                            Step {step.step_number}
                                        </span>
                                        <span className="text-[10px] font-mono text-gray-500 bg-dark-900 px-1.5 py-0.5 rounded border border-dark-700">
                                            Line {step.line_number}
                                        </span>
                                    </div>
                                    <div className={`text-sm font-mono truncate ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                        {step.line_text || '(empty line)'}
                                    </div>

                                    {isActive && step.scope && (
                                        <div className="mt-2 text-[10px] font-bold text-blue-500/80 uppercase">
                                            In {step.scope}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {steps.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                        <span className="text-4xl mb-4">📡</span>
                        <p className="text-xs font-bold uppercase tracking-widest">Awaiting Pulse...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;
