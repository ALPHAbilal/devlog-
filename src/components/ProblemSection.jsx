import { MessageSquare, Search, BookOpen, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { fadeInUp, staggerContainer, staggerItem, iconLift } from '../utils/animations';

const problems = [
  {
    icon: <BookOpen className="text-red-400" size={24} />,
    title: 'No time to document',
    description: 'You solve problems daily but never capture the solutions properly',
    delay: '0ms'
  },
  {
    icon: <MessageSquare className="text-orange-400" size={24} />,
    title: 'Knowledge scattered everywhere',
    description: 'Solutions in Slack, notes in Notion, code in GitHub - nothing connected',
    delay: '100ms'
  },
  {
    icon: <Brain className="text-yellow-400" size={24} />,
    title: 'Context evaporates',
    description: 'Three months later, you can\'t remember why that solution worked',
    delay: '200ms'
  },
  {
    icon: <Search className="text-purple-400" size={24} />,
    title: 'Can\'t find what you wrote',
    description: 'You documented it somewhere, but good luck finding it when you need it',
    delay: '300ms'
  }
];

export default function ProblemSection() {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section id="problem-section" className="py-20 px-4 md:px-6 bg-dark-secondary/20" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The documentation problem
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            You're too busy coding to document properly. And when you do, 
            it's scattered across tools that weren't built for developers.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-6 mb-16"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              className="relative bg-dark-secondary/50 rounded-lg p-6 border border-dark-secondary 
                         hover:border-red-400/30 transition-all duration-300 group overflow-hidden"
              variants={staggerItem}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              {/* Gradient border glow on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(239, 68, 68, 0.1), transparent 40%)",
                }}
              />
              
              <div className="flex items-start gap-4 relative z-10">
                <motion.div 
                  className="p-2 bg-dark-primary rounded-lg"
                  variants={iconLift}
                  initial="rest"
                  whileHover="hover"
                >
                  {problem.icon}
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-text-secondary">
                    {problem.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* The shift to solution */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 
                          text-accent-green rounded-full text-sm font-medium mb-6"
            whileHover={{ scale: 1 }}
          >
            <span className="text-accent-green">●</span>
            There's a better way
          </motion.div>
          
          <h3 className="text-3xl font-bold mb-4">
            Documentation that 
            <motion.span 
              className="text-accent-green inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
            >
              actually works
            </motion.span>
          </h3>
          
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            DevLog makes documenting as natural as coding. Capture solutions in context, 
            connect related concepts, and build a searchable knowledge base that grows with you.
          </p>
        </motion.div>
      </div>

    </section>
  );
}