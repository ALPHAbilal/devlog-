import { motion } from 'framer-motion'

const DevlogLogo = ({ size = 'md', animated = false }) => {
  const sizes = {
    sm: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-xl' },
    md: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-2xl' },
    lg: { container: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-3xl' },
  }

  const { container, icon, text } = sizes[size]

  const LogoContent = () => (
    <div className={`${container} bg-gradient-to-br from-accent-green to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-accent-green/20 relative overflow-hidden`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50" />
      
      {/* Icon */}
      <svg
        className={`${icon} text-white relative z-10`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.6
        }}
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
      >
        <LogoContent />
      </motion.div>
    )
  }

  return <LogoContent />
}

export default DevlogLogo