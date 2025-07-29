import { useEffect, useRef } from 'react'
import '../styles/auth-particles.css'

const AuthBackground = ({ mousePosition }) => {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.2
        this.pulseSpeed = Math.random() * 0.02 + 0.01
        this.pulsePhase = Math.random() * Math.PI * 2
      }

      update() {
        // Basic movement
        this.x += this.speedX
        this.y += this.speedY

        // Mouse repulsion
        const dx = this.x - mouseRef.current.x
        const dy = this.y - mouseRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150) {
          const force = (150 - distance) / 150
          this.x += dx * force * 0.02
          this.y += dy * force * 0.02
        }

        // Wrap around edges
        if (this.x < -10) this.x = canvas.width + 10
        if (this.x > canvas.width + 10) this.x = -10
        if (this.y < -10) this.y = canvas.height + 10
        if (this.y > canvas.height + 10) this.y = -10

        // Pulse animation
        this.pulsePhase += this.pulseSpeed
      }

      draw() {
        const pulseFactor = Math.sin(this.pulsePhase) * 0.3 + 1
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = '#10b981'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * pulseFactor, 0, Math.PI * 2)
        ctx.fill()

        // Glow effect
        ctx.globalAlpha = this.opacity * 0.3
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * pulseFactor * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Create particles
    const particleCount = window.innerWidth < 768 ? 30 : 50
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(new Particle())
    }

    // Draw connections between nearby particles
    const drawConnections = () => {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)'
      ctx.lineWidth = 0.5

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x
          const dy = particlesRef.current[i].y - particlesRef.current[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.globalAlpha = (100 - distance) / 100 * 0.2
            ctx.beginPath()
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y)
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y)
            ctx.stroke()
          }
        }
      }
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update()
        particle.draw()
      })

      // Draw connections
      drawConnections()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle mouse movement
    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      }
    }

    // Handle resize
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="auth-background-canvas"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Gradient mesh background */}
      <div className="auth-gradient-mesh">
        <div 
          className="auth-gradient-orb auth-gradient-orb-1"
          style={{
            transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)`,
          }}
        />
        <div 
          className="auth-gradient-orb auth-gradient-orb-2"
          style={{
            transform: `translate(${-mousePosition.x * 20}px, ${-mousePosition.y * 20}px)`,
          }}
        />
        <div 
          className="auth-gradient-orb auth-gradient-orb-3"
          style={{
            transform: `translate(${mousePosition.x * 25}px, ${-mousePosition.y * 25}px)`,
          }}
        />
      </div>
    </>
  )
}

export default AuthBackground