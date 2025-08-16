import { useEffect, useState } from 'react'

const AuthTransitions = ({ children, isTransitioning }) => {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (isTransitioning) {
      setShouldAnimate(true)
      const timer = setTimeout(() => setShouldAnimate(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  return (
    <div className={`auth-transition-wrapper ${shouldAnimate ? 'transitioning' : ''}`}>
      <div className="auth-transition-layer auth-transition-layer-1" />
      <div className="auth-transition-layer auth-transition-layer-2" />
      <div className="auth-transition-layer auth-transition-layer-3" />
      
      <div className="auth-transition-content">
        {children}
      </div>
    </div>
  )
}

export default AuthTransitions