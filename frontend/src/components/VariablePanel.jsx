import React from 'react'
import { LANGUAGE_MAP } from '../utils/languageConfig'

export default function VariablePanel({ step, language }) {
    const langConfig = LANGUAGE_MAP[language] || LANGUAGE_MAP['python']

    if (!step) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                <span className="text-3xl">📦</span>
                <p className="text-xs">No step selected</p>
            </div>
        )
    }

    const variables = step.variables || []

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-2 bg-dark-800 border-b border-dark-600 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Variables</span>
                <span className="text-xs text-gray-600">Step {step.step_number}</span>
            </div>

            {/* Scope badge */}
            <div className="px-4 py-2 border-b border-dark-700 flex items-center gap-2">
                <span className="text-xs text-gray-500">Scope:</span>
                <span
                    className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                    style={{ color: langConfig.accent, backgroundColor: `${langConfig.accent}18` }}
                >
                    {step.scope || 'global'}
                </span>
            </div>

            {/* Variables list */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
                {variables.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center mt-4">No variables in scope</p>
                ) : (
                    <div className="space-y-1.5">
                        {variables.map((v, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600 hover:border-dark-500 transition-colors"
                            >
                                {/* Type badge */}
                                <span className="type-badge flex-shrink-0 mt-0.5">{v.type}</span>

                                {/* Name */}
                                <span
                                    className="text-sm font-mono font-semibold flex-shrink-0"
                                    style={{ color: langConfig.accent }}
                                >
                                    {v.name}
                                </span>

                                <span className="text-gray-500 text-sm flex-shrink-0">=</span>

                                {/* Value */}
                                <span className="text-sm font-mono text-gray-200 break-all">
                                    {v.value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Output section */}
            {step.output && (
                <div className="border-t border-dark-600 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Output</p>
                    <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all bg-dark-900 rounded p-2">
                        {step.output}
                    </pre>
                </div>
            )}
        </div>
    )
}
