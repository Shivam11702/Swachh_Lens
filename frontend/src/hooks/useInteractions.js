import { useCallback, useRef, useEffect, useState } from 'react'

export function useSound() {
  const audioContextRef = useRef(null)
  const enabledRef = useRef(true)
  const hasUserGestureRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const markGesture = () => {
      hasUserGestureRef.current = true
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {})
      }
    }

    window.addEventListener('pointerdown', markGesture, { passive: true })
    window.addEventListener('keydown', markGesture)

    return () => {
      window.removeEventListener('pointerdown', markGesture)
      window.removeEventListener('keydown', markGesture)
    }
  }, [])

  const initAudio = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }, [])

  const playTone = useCallback((frequency = 800, duration = 100, type = 'sine', volume = 0.1) => {
    if (!enabledRef.current) return
    if (!hasUserGestureRef.current) return
    initAudio()
    const ctx = audioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
      return
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  }, [initAudio])

  const playClick = useCallback(() => playTone(800, 50, 'sine', 0.05), [playTone])
  const playSuccess = useCallback(() => {
    playTone(523, 100, 'sine', 0.08)
    setTimeout(() => playTone(659, 100, 'sine', 0.08), 100)
    setTimeout(() => playTone(784, 150, 'sine', 0.08), 200)
  }, [playTone])
  const playError = useCallback(() => {
    playTone(200, 200, 'sawtooth', 0.1)
    setTimeout(() => playTone(150, 200, 'sawtooth', 0.1), 150)
  }, [playTone])
  const playNotification = useCallback(() => {
    playTone(880, 100, 'sine', 0.07)
    setTimeout(() => playTone(1100, 100, 'sine', 0.07), 80)
  }, [playTone])
  const playHover = useCallback(() => playTone(1200, 30, 'sine', 0.02), [playTone])
  const playDrag = useCallback(() => playTone(400, 50, 'triangle', 0.04), [playTone])
  const playDrop = useCallback(() => playTone(600, 80, 'sine', 0.06), [playTone])

  const setEnabled = useCallback((enabled) => {
    enabledRef.current = enabled
  }, [])

  const toggleEnabled = useCallback(() => {
    enabledRef.current = !enabledRef.current
    return enabledRef.current
  }, [])

  return {
    playClick,
    playSuccess,
    playError,
    playNotification,
    playHover,
    playDrag,
    playDrop,
    setEnabled,
    toggleEnabled,
    enabled: enabledRef.current,
  }
}

export function useHaptic() {
  const vibrate = useCallback((pattern) => {
    if (typeof navigator === 'undefined') return
    if (!navigator.userActivation?.hasBeenActive) return
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const light = useCallback(() => vibrate(10), [vibrate])
  const medium = useCallback(() => vibrate(20), [vibrate])
  const heavy = useCallback(() => vibrate(50), [vibrate])
  const success = useCallback(() => vibrate([10, 50, 10]), [vibrate])
  const error = useCallback(() => vibrate([50, 50, 50]), [vibrate])
  const notification = useCallback(() => vibrate([20, 100, 20]), [vibrate])

  return { light, medium, heavy, success, error, notification }
}

export function useIntersectionObserver(options = {}) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options
  const [isIntersecting, setIsIntersecting] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          if (triggerOnce) observer.unobserve(element)
        } else if (!triggerOnce) {
          setIsIntersecting(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return [elementRef, isIntersecting]
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handler = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return reducedMotion
}

export function useSpringConfig(reducedMotion) {
  return reducedMotion
    ? { duration: 0.01 }
    : { type: 'spring', stiffness: 300, damping: 20 }
}

export function useStaggerDelay(index, baseDelay = 50) {
  return index * baseDelay
}

export function useKeyboardShortcut(key, callback, options = {}) {
  const { ctrl = false, meta = false, shift = false, alt = false, preventDefault = true } = options

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      
      const matches = 
        e.key.toLowerCase() === key.toLowerCase() &&
        e.ctrlKey === ctrl &&
        e.metaKey === meta &&
        e.shiftKey === shift &&
        e.altKey === alt

      if (matches) {
        if (preventDefault) e.preventDefault()
        callback(e)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, ctrl, meta, shift, alt, preventDefault, callback])
}
