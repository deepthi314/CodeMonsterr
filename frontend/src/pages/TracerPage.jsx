import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useTracer } from '../hooks/useTracer'
import { LANGUAGE_MAP, LANGUAGES, COMPILATION_LANGS } from '../utils/languageConfig'
import LanguageSelector from '../components/LanguageSelector'
import CodeEditor from '../components/CodeEditor'
import Timeline from '../components/Timeline'
import VariablePanel from '../components/VariablePanel'
import ControlBar from '../components/ControlBar'
import api from '../utils/api'

const TracerPage = () => {
    const location = useLocation()
    const [language, setLanguage] = useState('python')
    const [activeTab, setActiveTab] = useState('variables')
    const [codeByLanguage, setCodeByLanguage] = useState(() => {
        const initial = {}
        LANGUAGES.forEach(lang => {
            initial[lang.id] = LANGUAGE_MAP[lang.id].placeholder
        })
        return initial
    })

    useEffect(() => {
        if (location.state?.code && location.state?.language) {
            setLanguage(location.state.language);
            setCodeByLanguage(prev => ({
                ...prev,
                [location.state.language]: location.state.code
            }));
        }
    }, [location.state]);
    const [showCompilationBanner, setShowCompilationBanner] = useState(false)

    const {
        steps,
        currentStep,
        isLoading,
        error,
        explanation,
        isExplaining,
        isPlaying,
        trace,
        goToStep,
        nextStep,
        prevStep,
        startPlay,
        stopPlay,
        explain,
        reset,
    } = useTracer()

    const langConfig = LANGUAGE_MAP[language]
    const activeStep = steps[currentStep] || null

    useEffect(() => {
        document.documentElement.setAttribute('data-lang', language)
    }, [language])

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang)
        reset()
    }

    useEffect(() => {
        if (explanation) setActiveTab('explanation');
    }, [explanation]);

    useEffect(() => {
        if (isLoading && COMPILATION_LANGS.has(language)) {
            setShowCompilationBanner(true)
        } else {
            setShowCompilationBanner(false)
        }
    }, [isLoading, language])

    const handleTrace = async () => {
        const code = codeByLanguage[language] || ''
        const resultSteps = await trace(code, language)

        if (resultSteps && resultSteps.length > 0) {
            try {
                await api.saveHistory({
                    language,
                    code,
                    steps: resultSteps,
                    explanation: ""
                });
            } catch (err) {
                console.error("Auto-save failed", err);
            }
        }
    }

    const handleSaveNote = async () => {
        if (!activeStep) return;
        const title = `Snippet: ${language} execution`;
        const content = `Logic at line ${activeStep.line_number}: ${activeStep.line_text}\n\nTrace Scope: ${activeStep.scope}\n\nVariables: ${JSON.stringify(activeStep.variables)}`;
        try {
            await api.createNote({ title, content, color: '#3b82f6' });
            alert("Note saved to your dashboard!");
        } catch (err) {
            console.error(err);
        }
    }

    const tabs = [
        { id: 'variables', label: 'Variables', icon: '💎' },
        { id: 'explanation', label: 'AI Insights', icon: '✨' },
        { id: 'output', label: 'Output', icon: '📺' },
    ];

    return (
        <div className="flex flex-col h-full bg-dark-900 overflow-hidden" data-lang={language}>
            {/* Tracer Specific Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-dark-600 bg-dark-800/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-6">
                    <LanguageSelector selected={language} onChange={handleLanguageChange} />
                    <div className="h-6 w-px bg-dark-600 hidden md:block" />
                    <div className="hidden lg:flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Engine Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSaveNote}
                        disabled={!activeStep}
                        className="bg-dark-700 hover:bg-dark-600 disabled:opacity-30 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-dark-600 flex items-center gap-2"
                    >
                        <span>📝</span> SAVE SNAPSHOT
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showCompilationBanner && (
                    <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="bg-blue-600/10 border-b border-blue-500/50 px-6 py-2 text-xs font-bold text-blue-400 flex items-center gap-3"
                    >
                        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Compiling virtual machine for {langConfig.label}...
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-1 overflow-hidden">
                {/* 1. Code Editor Area */}
                <div className="flex flex-col w-[40%] border-r border-dark-600 bg-dark-950">
                    <div className="flex-1 overflow-hidden">
                        <CodeEditor
                            code={codeByLanguage[language] || ''}
                            onChange={(newCode) => setCodeByLanguage(prev => ({ ...prev, [language]: newCode }))}
                            language={language}
                            activeLineNumber={activeStep?.line_number}
                        />
                    </div>
                    <ControlBar
                        steps={steps}
                        currentStep={currentStep}
                        isLoading={isLoading}
                        isPlaying={isPlaying}
                        language={language}
                        onTrace={handleTrace}
                        onPrev={prevStep}
                        onNext={nextStep}
                        onPlay={() => startPlay(700)}
                        onStop={stopPlay}
                        onExplain={() => explain(language)}
                        isExplaining={isExplaining}
                    />
                </div>

                {/* 2. Central Timeline Area */}
                <div className="flex flex-col w-[30%] border-r border-dark-600">
                    <Timeline
                        steps={steps}
                        currentStep={currentStep}
                        onSelectStep={goToStep}
                        language={language}
                    />
                </div>

                {/* 3. Info Panel Area */}
                <div className="flex flex-col w-[30%] bg-dark-800/30">
                    <div className="flex border-b border-dark-600">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="h-full"
                            >
                                {activeTab === 'variables' && (
                                    <VariablePanel step={activeStep} language={language} />
                                )}
                                {activeTab === 'explanation' && (
                                    <div className="space-y-4">
                                        <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[24px]">
                                            <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-4 flex items-center gap-2">
                                                <span className="w-1 h-3 bg-blue-500 rounded-full" />
                                                Engine Analysis
                                            </h4>
                                            {isExplaining ? (
                                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-xs text-blue-400 font-bold animate-pulse">Consulting AI Knowledge Base...</p>
                                                </div>
                                            ) : explanation ? (
                                                <p className="text-sm text-gray-200 leading-relaxed font-inter">
                                                    {explanation}
                                                </p>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <p className="text-xs text-gray-500 italic mb-4">No analysis active. Click the ✨ button in the controls to evaluate this step.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'output' && (
                                    <div className="h-full font-mono text-sm bg-dark-900 border border-dark-600 rounded-2xl p-4 text-green-400 overflow-y-auto">
                                        {activeStep?.output ? (
                                            <pre>{activeStep.output}</pre>
                                        ) : (
                                            <p className="text-gray-700 italic">No program output recorded at this step.</p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TracerPage;
