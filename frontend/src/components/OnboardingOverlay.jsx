import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Check, Sparkles, MapPin, Upload, Users, Brain, Zap } from 'lucide-react'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to SwachhLens',
    description: 'AI-powered waste response operations dashboard. Monitor, assign, and track cleanup operations in real-time.',
    icon: Sparkles,
    highlight: null,
  },
  {
    id: 'map',
    title: 'Live City Map',
    description: 'View all waste reports on the interactive map. Color-coded by priority with heatmap overlay support.',
    icon: MapPin,
    highlight: '.map-panel-header',
  },
  {
    id: 'reports',
    title: 'Report Management',
    description: 'Filter, search, and review reports. Click any report to see details, photos, and ML insights.',
    icon: Upload,
    highlight: '.surface:has(.text-lg.font-semibold)',
  },
  {
    id: 'assign',
    title: 'Smart Assignment',
    description: 'AI suggests optimal team and vehicle based on waste type, volume, and location. One-click dispatch.',
    icon: Users,
    highlight: '.surface:has(.text-sm.font-semibold:contains("Assign"))',
  },
  {
    id: 'ml',
    title: 'ML Insights',
    description: 'Automatic classification, volume estimation, priority scoring, and duplicate detection powered by ML.',
    icon: Brain,
    highlight: '.surface:has(.text-sm.font-semibold:contains("ML"))',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Press <kbd>?</kbd> anytime for shortcuts. <kbd>Ctrl+N</kbd> new report, <kbd>Ctrl+R</kbd> refresh, <kbd>Esc</kbd> close.',
    icon: Zap,
    highlight: null,
  },
]

export function OnboardingOverlay({ isOpen, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setCompleted(false)
    }
  }, [isOpen])

  if (!isOpen || completed) return null

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1

  const next = () => {
    if (isLast) {
      setCompleted(true)
      onComplete?.()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const skip = () => {
    setCompleted(true)
    onSkip?.()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={skip}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <step.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="onboarding-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {step.title}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Step {currentStep + 1} of {STEPS.length}
                </div>
              </div>
            </div>
            <button
              onClick={skip}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300 transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 mb-4"
                  >
                    <step.icon className="w-10 h-10" aria-hidden="true" />
                  </motion.div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {STEPS.map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      disabled={i === currentStep}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentStep
                          ? 'bg-primary-500 w-8'
                          : 'bg-slate-300 dark:bg-surface-600 hover:bg-slate-400 dark:hover:bg-surface-500'
                      }`}
                      aria-label={`Go to step ${i + 1}`}
                      aria-current={i === currentStep ? 'step' : undefined}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-4 p-6 border-t border-slate-200 dark:border-surface-700 bg-slate-50/50 dark:bg-surface-800/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={prev}
              disabled={currentStep === 0}
              className="btn btn-secondary flex-1 justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={next}
              className="btn btn-primary flex-1 justify-center gap-2"
            >
              {isLast ? (
                <>
                  <Check className="w-4 h-4" />
                  Get Started
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function FeatureTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="surface rounded-2xl max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 mb-4">
            <step.icon className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{step.title}</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{step.description}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => isLast ? onClose() : setCurrentStep(currentStep + 1)}
              className="btn btn-primary"
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}