import { useState, useCallback, useRef } from 'react'
import { traceCode, explainStep } from '../utils/api'

export function useTracer() {
    const [steps, setSteps] = useState([])
    const [currentStep, setCurrentStep] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [explanation, setExplanation] = useState('')
    const [isExplaining, setIsExplaining] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const playIntervalRef = useRef(null)

    const trace = useCallback(async (code, language) => {
        setIsLoading(true)
        setError(null)
        setSteps([])
        setCurrentStep(0)
        setExplanation('')
        stopPlay()

        try {
            const result = await traceCode(code, language)
            setSteps(result)
            setCurrentStep(0)
            return result
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const goToStep = useCallback((index) => {
        setCurrentStep(index)
        setExplanation('')
    }, [])

    const nextStep = useCallback(() => {
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
        setExplanation('')
    }, [steps.length])

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(prev - 1, 0))
        setExplanation('')
    }, [])

    const startPlay = useCallback((speed = 800) => {
        setIsPlaying(true)
        playIntervalRef.current = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= steps.length - 1) {
                    clearInterval(playIntervalRef.current)
                    setIsPlaying(false)
                    return prev
                }
                return prev + 1
            })
        }, speed)
    }, [steps.length])

    const stopPlay = useCallback(() => {
        if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current)
            playIntervalRef.current = null
        }
        setIsPlaying(false)
    }, [])

    const explain = useCallback(async (language) => {
        if (!steps[currentStep]) return
        setIsExplaining(true)
        setExplanation('')
        try {
            const result = await explainStep(steps[currentStep], language)
            setExplanation(result.explanation)
        } catch (err) {
            setExplanation('Could not generate explanation.')
        } finally {
            setIsExplaining(false)
        }
    }, [steps, currentStep])

    const reset = useCallback(() => {
        stopPlay()
        setSteps([])
        setCurrentStep(0)
        setError(null)
        setExplanation('')
    }, [stopPlay])

    return {
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
    }
}
