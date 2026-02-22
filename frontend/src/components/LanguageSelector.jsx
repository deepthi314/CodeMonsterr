import React from 'react'
import { LANGUAGES } from '../utils/languageConfig'

export default function LanguageSelector({ selected, onChange }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Language</span>
            <div className="flex gap-1">
                {LANGUAGES.map(lang => {
                    const isActive = selected === lang.id
                    return (
                        <button
                            key={lang.id}
                            id={`lang-btn-${lang.id}`}
                            onClick={() => onChange(lang.id)}
                            title={lang.label}
                            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 border
                ${isActive
                                    ? 'text-white border-transparent shadow-lg'
                                    : 'text-gray-400 border-dark-600 hover:text-gray-200 hover:border-gray-500 bg-dark-800'
                                }
              `}
                            style={isActive ? {
                                backgroundColor: lang.accent,
                                boxShadow: `0 0 16px ${lang.accent}40`,
                            } : {}}
                        >
                            <span className="text-base leading-none">{lang.icon}</span>
                            <span className="hidden sm:inline">{lang.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
