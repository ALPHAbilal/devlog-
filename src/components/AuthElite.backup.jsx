import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/api'
import { getURL } from '@/shared/lib'
import { useNavigate } from 'react-router-dom'
import AuthBackground from './AuthBackground'
import AuthFormElite from './AuthFormElite'
import AuthTransitions from './AuthTransitions'
import { Terminal, GitBranch, Zap, Shield, Code2, Database, Sparkles } from 'lucide-react'
import '../styles/auth-elite.css'
import '../styles/auth-animations-elite.css'

const AuthElite = () => {
  const [authView, setAuthView] = useState('sign_in')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [viewportClass, setViewportClass] = useState('')
  const containerRef = useRef(null)
  const navigate = useNavigate()
  
  // Viewport detection
  useEffect(() => {
    const updateViewportClass = () => {
      const height = window.innerHeight
      if (height < 600) {
        setViewportClass('viewport-ultra-compact')
      } else if (height < 700) {
        setViewportClass('viewport-compact')
      } else if (height < 800) {
        setViewportClass('viewport-medium')
      } else {
        setViewportClass('')
      }
    }
    
    updateViewportClass()
    window.addEventListener('resize', updateViewportClass)
    
    // Handle viewport resize on mobile (when keyboard appears)
    const visualViewport = window.visualViewport
    if (visualViewport) {
      visualViewport.addEventListener('resize', updateViewportClass)
    }
    
    return () => {
      window.removeEventListener('resize', updateViewportClass)
      if (visualViewport) {
        visualViewport.removeEventListener('resize', updateViewportClass)
      }
    }
  }, [])

  // Live typing animation for taglines
  const taglines = [
    "Never lose a solution again",
    "Your code snippets, forever searchable",
    "Where debugging sessions become documentation",
    "Building your developer knowledge graph"
  ]
  const [currentTagline, setCurrentTagline] = useState('')
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  // Developer statistics ticker - Beta mode (placeholder values)
  const stats = [
    /* Beta - Real statistics hidden until launch
    { value: '12,847', label: 'developers', icon: Code2 },
    { value: '3.2M', label: 'snippets saved', icon: Database },
    { value: '847K', label: 'bugs solved', icon: Zap },
    { value: '99.9%', label: 'uptime', icon: Shield }
    */
    { value: 'Beta', label: 'early access', icon: Sparkles },
    { value: '∞', label: 'possibilities', icon: Database },
    { value: '100%', label: 'your data', icon: Shield },
    { value: '0', label: 'ads forever', icon: Zap }
  ]

  // Viewport detection and dynamic class application
  useEffect(() => {
    const checkViewport = () => {
      const vh = window.innerHeight
      const vw = window.innerWidth
      let classes = []
      
      if (vh < 600) classes.push('viewport-ultra-compact')
      else if (vh < 700) classes.push('viewport-compact')
      
      if (vw < 640) classes.push('viewport-mobile')
      else if (vw < 1024) classes.push('viewport-tablet')
      
      if (window.matchMedia('(orientation: landscape)').matches && vh < 500) {
        classes.push('viewport-landscape-compact')
      }
      
      setViewportClass(classes.join(' '))
    }
    
    checkViewport()
    window.addEventListener('resize', checkViewport)
    window.addEventListener('orientationchange', checkViewport)
    
    // Also check on visibility change (mobile browser URL bar hide/show)
    document.addEventListener('visibilitychange', checkViewport)
    
    return () => {
      window.removeEventListener('resize', checkViewport)
      window.removeEventListener('orientationchange', checkViewport)
      document.removeEventListener('visibilitychange', checkViewport)
    }
  }, [])

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height
        setMousePosition({ x, y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Typing animation effect
  useEffect(() => {
    const currentText = taglines[taglineIndex]
    let charIndex = 0
    let typingTimeout

    const typeChar = () => {
      if (isTyping && charIndex <= currentText.length) {
        setCurrentTagline(currentText.slice(0, charIndex))
        charIndex++
        typingTimeout = setTimeout(typeChar, 50 + Math.random() * 50)
      } else if (isTyping) {
        // Finished typing, wait then move to next
        setTimeout(() => {
          setIsTyping(false)
          setTimeout(() => {
            setTaglineIndex((prev) => (prev + 1) % taglines.length)
            setIsTyping(true)
          }, 500)
        }, 2000)
      }
    }

    if (isTyping) {
      typeChar()
    }

    return () => clearTimeout(typingTimeout)
  }, [isTyping, taglineIndex])

  // Handle view transitions with animation
  const handleViewChange = useCallback((newView) => {
    if (newView !== authView) {
      setIsTransitioning(true)
      setTimeout(() => {
        setAuthView(newView)
        setError(null)
        setSuccessMessage(null)
        setTimeout(() => setIsTransitioning(false), 50)
      }, 300)
    }
  }, [authView])

  // Handle authentication
  const handleAuth = async (type, credentials) => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      let result
      if (type === 'sign_in') {
        result = await supabase.auth.signInWithPassword(credentials)
      } else if (type === 'sign_up') {
        result = await supabase.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: getURL() + 'auth/callback',
          }
        })
      } else if (type === 'provider') {
        result = await supabase.auth.signInWithOAuth({
          provider: credentials.provider,
          options: {
            redirectTo: getURL() + 'auth/callback',
          }
        })
        return // OAuth redirects, no need to handle response
      }

      if (result.error) {
        throw result.error
      }

      if (type === 'sign_up') {
        setSuccessMessage('🎉 Check your email to confirm your account!')
      } else {
        setSuccessMessage('✨ Welcome back! Redirecting...')
        setTimeout(() => navigate('/'), 1500)
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`auth-elite-container ${viewportClass}`} ref={containerRef}>
      {/* Dynamic animated background */}
      <AuthBackground mousePosition={mousePosition} />

      {/* Main content wrapper with parallax */}
      <div className="auth-elite-content">
        {/* Left side - Branding */}
        <div 
          className="auth-elite-branding"
          style={{
            transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
          }}
        >
          <div className="auth-elite-logo-group">
            <Terminal className="auth-elite-logo" size={48} />
            <h1 className="auth-elite-brand">Devlog</h1>
          </div>

          <div className="auth-elite-tagline-container">
            <h2 className="auth-elite-tagline">
              <span className="auth-elite-prompt">$</span>
              <span className="auth-elite-typing">
                {currentTagline}
                <span className="auth-elite-cursor">_</span>
              </span>
            </h2>
          </div>

          <div className="auth-elite-features">
            <div className="auth-elite-feature">
              <GitBranch size={20} />
              <span>Version control for your knowledge</span>
            </div>
            <div className="auth-elite-feature">
              <Sparkles size={20} />
              <span>AI conversations preserved forever</span>
            </div>
            <div className="auth-elite-feature">
              <Database size={20} />
              <span>Your personal developer database</span>
            </div>
          </div>

          {/* Developer stats ticker */}
          <div className="auth-elite-stats">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div 
                  key={index} 
                  className="auth-elite-stat"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <Icon size={16} />
                  <span className="auth-elite-stat-value">{stat.value}</span>
                  <span className="auth-elite-stat-label">{stat.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right side - Auth form */}
        <div 
          className="auth-elite-form-section"
          style={{
            transform: `translate(${-mousePosition.x * 10}px, ${-mousePosition.y * 10}px)`,
          }}
        >
          <AuthTransitions isTransitioning={isTransitioning}>
            <AuthFormElite
              authView={authView}
              onViewChange={handleViewChange}
              onAuth={handleAuth}
              isLoading={isLoading}
              error={error}
              successMessage={successMessage}
            />
          </AuthTransitions>
        </div>
      </div>

      {/* Floating particles overlay */}
      <div className="auth-elite-particles" />
    </div>
  )
}

export default AuthElite