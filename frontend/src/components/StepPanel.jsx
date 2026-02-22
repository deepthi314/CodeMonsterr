import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LANGUAGE_MAP } from '../utils/languageConfig'

const EVENT_STYLES = {
    line: { cls: 'event-line', label: 'line' },
    call: { cls: 'event-call', label: 'call' },
    return: { cls: 'event-return', label: 'return' },
    error: { cls: 'event-error', label: 'error' },
}

export default function StepPanel({ steps, currentStep, onSelectStep, language }) {
    const listRef = useRef(null)
    const langConfig = LANGUAGE_MAP[language] || LANGUAGE_MAP['python']

    // Auto-scroll active step into view
    useEffect(() => {
        if (listRef.current) {
            const active = listRef.current.querySelector('.step-card.active')
            if (active) {
                active.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
        }
    }, [currentStep])

    if (!steps.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                <span className="text-4xl">🦖</span>
                <p className="text-sm">Run your code to see execution steps</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-2 bg-dark-800 border-b border-dark-600 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Steps</span>
                <span className="text-xs text-gray-500">{steps.length} total</span>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto">
                {steps.map((step, i) => {
                    const isActive = i === currentStep
                    const evStyle = EVENT_STYLES[step.event] || EVENT_STYLES.line
                    return (
                        <div
                            key={i}
                            id={`step-${i}`}
                            className={`step-card px-4 py-2.5 cursor-pointer border-l-2 border-transparent ${isActive ? 'active' : ''}`}
                            style={isActive ? {
                                backgroundColor: `${langConfig.accent}12`,
                                borderLeftColor: langConfig.accent,
                            } : {}}
                            onClick={() => onSelectStep(i)}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="text-xs font-bold font-mono w-6 text-right flex-shrink-0"
                                    style={{ color: isActive ? langConfig.accent : '#484f58' }}
                                >
                                    {step.step_number}
                                </span>
                                <span className={`event-badge ${evStyle.cls}`}>{evStyle.label}</span>
                                <span className="text-xs text-gray-500 truncate font-mono">
                                    L{step.line_number}
                                </span>
                                {step.scope && step.scope !== 'global' && (
                                    <span className="text-xs text-gray-600 truncate">
                                        in <span className="text-gray-400">{step.scope}</span>
                                    </span>
                                )}
                            </div>
                            {step.line_text && (
                                <p className="text-xs font-mono text-gray-300 truncate pl-8">
                                    {step.line_text}
                                </p>
                            )}
                            {step.output && (
                                <p className="text-xs text-green-400 truncate pl-8 mt-0.5">
                                    ▶ {step.output}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
