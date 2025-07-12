import { MessageSquare, Search, BookOpen, Brain } from 'lucide-react';
import { useEffect } from 'react';

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
  // Add CSS animation on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <section id="problem-section" className="py-20 px-4 md:px-6 bg-dark-secondary/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The documentation problem
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            You're too busy coding to document properly. And when you do, 
            it's scattered across tools that weren't built for developers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-dark-secondary/50 rounded-lg p-6 border border-dark-secondary 
                         hover:border-red-400/30 transition-all duration-300 group"
              style={{
                animation: `fadeInUp 0.6s ease-out ${problem.delay} both`
              }}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-dark-primary rounded-lg group-hover:scale-110 transition-transform">
                  {problem.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-text-secondary">
                    {problem.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* The shift to solution */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 
                          text-accent-green rounded-full text-sm font-medium mb-6">
            <span className="animate-pulse">●</span>
            There's a better way
          </div>
          
          <h3 className="text-3xl font-bold mb-4">
            Documentation that 
            <span className="text-accent-green"> actually works</span>
          </h3>
          
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            DevLog makes documenting as natural as coding. Capture solutions in context, 
            connect related concepts, and build a searchable knowledge base that grows with you.
          </p>
        </div>
      </div>

    </section>
  );
}