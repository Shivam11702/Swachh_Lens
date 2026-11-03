import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogIn, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginModal({ open, onClose, onLogin }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter email and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await onLogin(email.trim(), password)
      setEmail('')
      setPassword('')
      onClose()
      void data
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="surface rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 id="login-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-primary-500" aria-hidden="true" />
                Operator sign in
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="label">Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@swachhlens.app"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="login-password" className="label">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 flex items-start gap-2 text-sm text-error-700 dark:text-error-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full justify-center gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LogIn className="w-4 h-4" aria-hidden="true" />}
                Sign in
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
