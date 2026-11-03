import React, { useEffect, useRef, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const PARTICLE_COUNT = 30
const COLORS = [
  'rgba(59, 130, 246, 0.15)',
  'rgba(16, 185, 129, 0.15)',
  'rgba(245, 158, 11, 0.15)',
  'rgba(139, 92, 246, 0.15)',
]

function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 80 + 40,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
  }))
}

export function ParticleField({ className = '', intensity = 1 }) {
  const particlesRef = useRef(null)
  const [particles] = useState(() => generateParticles(PARTICLE_COUNT * intensity))

  if (!particlesRef.current) {
    particlesRef.current = particles
  }

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {particlesRef.current.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-[80px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
          }}
          animate={{
            x: [{ value: 0 }, { value: (Math.random() - 0.5) * 100 }, { value: 0 }],
            y: [{ value: 0 }, { value: (Math.random() - 0.5) * 100 }, { value: 0 }],
            scale: [1, 1.2, 1],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export function GradientMesh({ className = '', colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'] }) {
  const [time, setTime] = useState(0)

  useEffect(() => {
    let frame = 0
    const animate = () => {
      frame++
      setTime(frame * 0.001)
      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animate)
  }, [])

  const gradients = useMemo(() => colors.map((color, i) => ({
    x: 50 + Math.sin(time + i * 2) * 30,
    y: 50 + Math.cos(time * 0.7 + i * 1.5) * 25,
    size: 300 + Math.sin(time * 0.5 + i) * 100,
    color,
  })), [time])

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {gradients.map((g, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[150px] opacity-20"
          style={{
            left: `${g.x}%`,
            top: `${g.y}%`,
            width: `${g.size}px`,
            height: `${g.size}px`,
            backgroundColor: g.color,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  )
}

export function GridPattern({ className = '', color = 'currentColor', opacity = 0.03, size = 60 }) {
  return (
    <div className={`fixed inset-0 -z-10 pointer-events-none ${className}`} aria-hidden="true">
      <svg width="100%" height="100%" style={{ opacity }}>
        <defs>
          <pattern id="grid" width={size} height={size} patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 0 100" stroke={color} strokeWidth="0.5" />
            <path d="M 0 0 L 100 0" stroke={color} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

export function FloatingOrbs({ count = 5, className = '' }) {
  const orbs = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 200 + 150,
      hue: Math.random() * 360,
      speed: Math.random() * 0.5 + 0.2,
    }))
  , [])

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full blur-[120px] mix-blend-overlay"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: `hsl(${orb.hue}, 70%, 60%)`,
            opacity: 0.15,
          }}
          animate={{
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
            borderRadius: ['50%', '40% 60% 50% 50%', '50%'],
          }}
          transition={{
            duration: 20 / orb.speed,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export function AuroraBackground({ className = '' }) {
  const layers = [
    { color: 'rgba(59, 130, 246, 0.06)', offsetX: -20, offsetY: -10, scale: 1.3, speed: 0.3 },
    { color: 'rgba(139, 92, 246, 0.05)', offsetX: 110, offsetY: 110, scale: 1.2, speed: 0.36 },
  ]

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {layers.map((layer, i) => (
        <motion.div
          key={i}
          className="absolute blur-[120px] rounded-full"
          style={{
            left: `${layer.offsetX}%`,
            top: `${layer.offsetY}%`,
            width: `600px`,
            height: `600px`,
            backgroundColor: layer.color,
            transform: `scale(${layer.scale})`,
            willChange: 'transform',
          }}
          animate={{
            x: [-30, 30, -30],
            y: [-20, 20, -20],
            scale: [layer.scale, layer.scale * 1.05, layer.scale],
          }}
          transition={{
            duration: 60 / layer.speed,
            delay: i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export function ScanlineOverlay({ className = '', intensity = 0.02 }) {
  return (
    <div className={`fixed inset-0 -z-10 pointer-events-none ${className}`} aria-hidden="true">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
            <rect width="100%" height="1" fill="currentColor" opacity={intensity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scanlines)" />
      </svg>
    </div>
  )
}

export function Vignette({ className = '' }) {
  return (
    <div 
      className={`fixed inset-0 -z-10 pointer-events-none ${className}`}
      aria-hidden="true"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.15) 100%)',
      }}
    />
  )
}

export function AnimatedBackground({ 
  variant = 'default', 
  className = '',
  showGrid = false,
  showVignette = true,
}) {
  const variants = {
    default: <GradientMesh />,
    particles: <ParticleField intensity={1} />,
    orbs: <FloatingOrbs count={6} />,
    aurora: <AuroraBackground />,
    subtle: <GridPattern opacity={0.02} />,
    mesh: <GradientMesh colors={['#93c5fd', '#a5f3fc', '#c4b5fd', '#fde68a']} />,
  }

  return (
    <div className={`fixed inset-0 -z-10 ${className}`} aria-hidden="true">
      {variants[variant] || variants.default}
      {showGrid && <GridPattern opacity={0.015} size={80} />}
      {showVignette && <Vignette />}
    </div>
  )
}