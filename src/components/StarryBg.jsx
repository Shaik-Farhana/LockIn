import { useEffect, useRef } from 'react'
import { useApp } from '../context/useApp'

export default function StarryBg() {
  const canvasRef = useRef(null)
  const { mode } = useApp()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let scrollY = 0

    const onScroll = () => { scrollY = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const isGolden = mode === 'golden'

    // ── LAYER 1: deep background nebula blobs (slowest parallax)
    const nebulas = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 140 + 60,
      opacity: Math.random() * 0.07 + 0.02,
      color: isGolden ? '#e85d20' : '#183282',
    }))

    // ── LAYER 2: mid swirls (medium parallax)
    const swirls = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 55 + 18,
      speed: (Math.random() - 0.5) * 0.25,
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.07 + 0.02,
    }))

    // ── LAYER 3: stars (fastest parallax - most depth)
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 0.35 + 0.05,
      phase: Math.random() * Math.PI * 2,
      color: isGolden
        ? (Math.random() > 0.5 ? '#FFD97D' : '#ff9e6b')
        : (Math.random() > 0.7 ? '#FFC52D' : Math.random() > 0.5 ? '#FCE997' : '#a8d4e8'),
      layer: Math.random(), // 0=back, 1=front
    }))

    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width * 0.3, canvas.height)
      if (isGolden) {
        grad.addColorStop(0, '#1a0800')
        grad.addColorStop(0.35, '#2d1200')
        grad.addColorStop(0.7, '#3d2200')
        grad.addColorStop(1, '#1f0d00')
      } else {
        grad.addColorStop(0, '#0a0f1e')
        grad.addColorStop(0.4, '#0d1b3e')
        grad.addColorStop(0.7, '#122460')
        grad.addColorStop(1, '#1a1230')
      }
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Golden hour: warm horizon glow at bottom
      if (isGolden) {
        const horizGrad = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height)
        horizGrad.addColorStop(0, 'rgba(200, 80, 10, 0)')
        horizGrad.addColorStop(0.5, 'rgba(200, 80, 10, 0.12)')
        horizGrad.addColorStop(1, 'rgba(100, 40, 5, 0.35)')
        ctx.fillStyle = horizGrad
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Simple hill silhouette
        ctx.beginPath()
        ctx.moveTo(0, canvas.height)
        ctx.bezierCurveTo(
          canvas.width * 0.15, canvas.height * 0.75,
          canvas.width * 0.35, canvas.height * 0.70,
          canvas.width * 0.5, canvas.height * 0.78
        )
        ctx.bezierCurveTo(
          canvas.width * 0.65, canvas.height * 0.85,
          canvas.width * 0.85, canvas.height * 0.72,
          canvas.width, canvas.height * 0.8
        )
        ctx.lineTo(canvas.width, canvas.height)
        ctx.closePath()
        ctx.fillStyle = 'rgba(10, 25, 5, 0.6)'
        ctx.fill()
      }

      // ── Layer 1: nebulas (parallax * 0.08)
      const p1 = scrollY * 0.08
      nebulas.forEach(n => {
        // simpler approach:
        ctx.beginPath()
        ctx.arc(n.x, n.y - p1, n.r, 0, Math.PI * 2)
        ctx.fillStyle = isGolden ? `rgba(200, 80, 20, ${n.opacity})` : `rgba(24, 50, 130, ${n.opacity})`
        ctx.fill()
      })

      // ── Layer 2: swirls (parallax * 0.2)
      const p2 = scrollY * 0.2
      swirls.forEach(s => {
        s.angle += s.speed * 0.008
        ctx.beginPath()
        ctx.arc(
          s.x + Math.cos(s.angle) * 18,
          (s.y - p2) + Math.sin(s.angle) * 9,
          s.r, 0, Math.PI * 2
        )
        ctx.strokeStyle = isGolden
          ? `rgba(255, 160, 60, ${s.opacity})`
          : `rgba(108, 158, 179, ${s.opacity})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      // ── Layer 3: stars (parallax based on layer depth)
      stars.forEach(s => {
        const parallax = scrollY * (0.15 + s.layer * 0.45)
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y - parallax, s.r * twinkle, 0, Math.PI * 2)
        ctx.fillStyle = s.color
        ctx.globalAlpha = twinkle * 0.9
        ctx.fill()
        ctx.globalAlpha = 1
      })

      // Moon / Sun glow
      const glowX = canvas.width * 0.82
      const glowY = canvas.height * 0.12
      const glowR = 130
      const moonGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR)
      if (isGolden) {
        moonGrad.addColorStop(0, 'rgba(255, 180, 50, 0.35)')
        moonGrad.addColorStop(0.3, 'rgba(255, 120, 20, 0.15)')
        moonGrad.addColorStop(1, 'rgba(255, 80, 0, 0)')
      } else {
        moonGrad.addColorStop(0, 'rgba(252, 233, 151, 0.25)')
        moonGrad.addColorStop(0.4, 'rgba(252, 233, 151, 0.08)')
        moonGrad.addColorStop(1, 'rgba(252, 233, 151, 0)')
      }
      ctx.fillStyle = moonGrad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      t += 0.01
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [mode])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
