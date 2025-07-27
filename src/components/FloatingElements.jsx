import { motion } from 'framer-motion';

export default function FloatingElements() {
  // Code snippets to display
  const codeSnippets = [
    `const solution = await find('error');`,
    `// Fixed: CORS issue
fetch(url, { 
  mode: 'cors' 
})`,
    `git commit -m "✨ solved"`
  ];

  return (
    <div className="hero-floating-elements">
      {/* Geometric shapes */}
      <div className="floating-shape floating-shape-1" />
      <div className="floating-shape floating-shape-2" />
      <div className="floating-shape floating-shape-3" />
      
      {/* Floating code snippets */}
      {codeSnippets.map((code, index) => (
        <motion.div
          key={index}
          className={`floating-code floating-code-${index + 1}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{
            delay: index * 0.5 + 1,
            duration: 0.8,
          }}
        >
          <code>{code}</code>
        </motion.div>
      ))}
      
      {/* Glass morphism bubbles */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-1/3 left-1/5 w-24 h-24 rounded-full"
        style={{
          background: 'rgba(16, 185, 129, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}
        animate={{
          y: [0, 40, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}