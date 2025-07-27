import { motion } from 'framer-motion';

export default function GradientMesh() {
  return (
    <div className="hero-gradient-mesh">
      <motion.div 
        className="mesh-gradient"
        animate={{
          background: [
            `radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 90% 70%, rgba(236, 72, 153, 0.3) 0%, transparent 40%)`,
            `radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 90% 70%, rgba(139, 92, 246, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.3) 0%, transparent 40%)`,
            `radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 90% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 40%)`,
          ],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}