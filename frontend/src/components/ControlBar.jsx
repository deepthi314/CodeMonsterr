import React from 'react'
import { LANGUAGE_MAP } from '../utils/languageConfig'

export default function ControlBar({
    steps,
    currentStep,
    isLoading,
    isPlaying,
    language,
    onTrace,
    onPrev,
    onNext,
    onPlay,
    onStop,
    onExplain,
    isExplaining,
}) {
    const langConfig = LANGUAGE_MAP[language] || LANGUAGE_MAP['python']
    const hasSteps = steps.length > 0
    const isFirst = currentStep === 0
    const isLast = currentStep === steps.length - 1

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-dark-800 border-t border-dark-600 flex-wrap">
            {/* Run button */}
            <button
                id="btn-trace"
                onClick={onTrace}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: langConfig.accent }}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Tracing...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Trace
                    </>
                )}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-dark-600" />

            {/* Step navigation */}
            <div className="flex items-center gap-1">
                <button
                    id="btn-prev"
                    onClick={onPrev}
                    disabled={!hasSteps || isFirst}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous step"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Step counter with language badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-900 rounded-lg border border-dark-600 min-w-[100px] justify-center">
                    <span className="text-base leading-none">{langConfig.icon}</span>
                    <span className="text-sm font-mono font-semibold text-gray-200">
                        {hasSteps ? `${currentStep + 1} / ${steps.length}` : '— / —'}
                    </span>
                </div>

                <button
                    id="btn-next"
                    onClick={onNext}
                    disabled={!hasSteps || isLast}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next step"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Play / Stop */}
            {hasSteps && (
                <button
                    id="btn-play"
                    onClick={isPlaying ? onStop : onPlay}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-dark-600 hover:border-gray-500 text-gray-300 hover:text-white transition-colors"
                >
                    {isPlaying ? (
                        <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Pause
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Auto-play
                        </>
                    )}
                </button>
            )}

            {/* Explain button */}
            {hasSteps && (
                <button
                    id="btn-explain"
                    onClick={onExplain}
                    disabled={isExplaining}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-dark-600 hover:border-gray-500 text-gray-300 hover:text-white transition-colors disabled:opacity-40"
                >
                    {isExplaining ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Explaining...
                        </>
                    ) : (
                        <>✨ Explain</>
                    )}
                </button>
            )}
        </div>
    )
}
