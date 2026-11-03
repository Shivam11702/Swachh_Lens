import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Spotlight({ className, size = 200, springOptions = { bounce: 0 } }) {
  const containerRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [parentElement, setParentElement] = useState(null)

  const mouseX = useSpring(0, springOptions)
  const mouseY = useSpring(0, springOptions)

  const spotlightLeft = useTransform(mouseX, (x) => `${x - size / 2}px`)
  const spotlightTop = useTransform(mouseY, (y) => `${y - size / 2}px`)

  useEffect(() => {
    if (containerRef.current) {
      const parentNode = containerRef.current.parentElement
      if (parentNode) {
        parentNode.style.position = 'relative'
        parentNode.style.overflow = 'hidden'
        setParentElement(parentNode)
      }
    }
  }, [])

  const handleMouseMove = useCallback(
    (event) => {
      if (!parentElement) return
      const { left, top } = parentElement.getBoundingClientRect()
      mouseX.set(event.clientX - left)
      mouseY.set(event.clientY - top)
    },
    [mouseX, mouseY, parentElement]
  )

  useEffect(() => {
    if (!parentElement) return
    parentElement.addEventListener('mousemove', handleMouseMove)
    parentElement.addEventListener('mouseenter', () => setIsHovered(true))
    parentElement.addEventListener('mouseleave', () => setIsHovered(false))
    return () => {
      parentElement.removeEventListener('mousemove', handleMouseMove)
      parentElement.removeEventListener('mouseenter', () => setIsHovered(true))
      parentElement.removeEventListener('mouseleave', () => setIsHovered(false))
    }
  }, [parentElement, handleMouseMove])

  const opacity = isHovered ? 1 : 0

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute z-40 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_70%)]',
        className
      )}
      style={{
        left: spotlightLeft,
        top: spotlightTop,
        opacity,
      }}
    />
  )
}
