import React, { useEffect, useRef } from 'react'
import { LANGUAGE_MAP } from '../utils/languageConfig'

export default function CodeEditor({ code, onChange, language, activeLineNumber }) {
    const textareaRef = useRef(null)
    const overlayRef = useRef(null)
    const langConfig = LANGUAGE_MAP[language] || LANGUAGE_MAP['python']

    // Sync scroll between textarea and overlay
    const handleScroll = () => {
        if (overlayRef.current && textareaRef.current) {
            overlayRef.current.scrollTop = textareaRef.current.scrollTop
            overlayRef.current.scrollLeft = textareaRef.current.scrollLeft
        }
    }

    const lines = code.split('\n')

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 bg-dark-800 border-b border-dark-600">
                <div className="flex items-center gap-2">
                    <span className="text-base">{langConfig.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: langConfig.accent }}>
                        {langConfig.label}
                    </span>
                    <span className="text-xs text-gray-600">editor</span>
                </div>
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-60" />
                    <span className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Line numbers */}
                <div className="flex-shrink-0 w-12 bg-dark-900 border-r border-dark-700 overflow-hidden">
                    <div
                        ref={overlayRef}
                        className="h-full overflow-hidden pt-3 pb-3"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {lines.map((_, i) => (
                            <div
                                key={i}
                                className={`
                  text-right pr-3 text-xs leading-6 select-none
                  ${activeLineNumber === i + 1 ? 'font-bold' : 'text-gray-600'}
                `}
                                style={activeLineNumber === i + 1 ? { color: langConfig.accent } : {}}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active line highlight overlay */}
                <div className="absolute left-12 right-0 pointer-events-none" style={{ top: 0 }}>
                    {activeLineNumber && (
                        <div
                            className="absolute left-0 right-0 h-6"
                            style={{
                                top: `${(activeLineNumber - 1) * 24 + 12}px`,
                                backgroundColor: `${langConfig.accent}18`,
                                borderLeft: `3px solid ${langConfig.accent}`,
                            }}
                        />
                    )}
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    id="code-editor"
                    value={code}
                    onChange={e => onChange(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck={false}
                    placeholder={langConfig.placeholder}
                    className="
            flex-1 bg-dark-900 text-gray-200 font-mono text-sm
            resize-none outline-none border-none
            px-4 py-3 leading-6
            placeholder-gray-700
          "
                    style={{ tabSize: 2 }}
                />
            </div>
        </div>
    )
}
