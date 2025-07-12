import { useState } from 'react';
import { Play, Pause, Terminal, Code2, Search, Clock, CheckCircle } from 'lucide-react';

const workflowSteps = [
  {
    time: '0:00',
    title: 'Hit a familiar error',
    description: 'CORS error in production',
    icon: <Terminal className="text-red-400" size={20} />
  },
  {
    time: '0:08',
    title: 'Search DevLog',
    description: 'Type "cors production"',
    icon: <Search className="text-accent-green" size={20} />
  },
  {
    time: '0:12',
    title: 'Find your solution',
    description: 'With full context from 3 months ago',
    icon: <CheckCircle className="text-accent-green" size={20} />
  },
  {
    time: '0:18',
    title: 'Copy & implement',
    description: 'Working code with your notes',
    icon: <Code2 className="text-blue-400" size={20} />
  },
  {
    time: '0:25',
    title: 'Back to building',
    description: 'Problem solved in seconds, not hours',
    icon: <Clock className="text-accent-green" size={20} />
  }
];

export default function WorkflowVideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In real implementation, this would control video playback
  };

  return (
    <section className="py-20 px-4 md:px-6 bg-dark-secondary/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your Daily Workflow, <span className="text-accent-green">Transformed</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Watch how DevLog turns hours of searching into seconds of finding.
            This is a real developer solving a real problem.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video player */}
          <div className="lg:col-span-2">
            <div className="relative bg-dark-primary rounded-lg overflow-hidden shadow-2xl">
              {/* Video placeholder */}
              <div className="aspect-video bg-gradient-to-br from-dark-secondary to-dark-primary 
                              flex items-center justify-center relative">
                {/* Terminal mockup */}
                <div className="absolute inset-4 bg-black/50 rounded-lg p-4 font-mono text-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  
                  {currentStep >= 0 && (
                    <div className="text-red-400 mb-2">
                      Error: Access to fetch at 'https://api.example.com' from origin 
                      'http://localhost:3000' has been blocked by CORS policy
                    </div>
                  )}
                  
                  {currentStep >= 1 && (
                    <div className="text-accent-green mb-2">
                      $ devlog search "cors production"
                    </div>
                  )}
                  
                  {currentStep >= 2 && (
                    <div className="text-text-primary">
                      Found: CORS Configuration for Production (Last used: 3 months ago)
                    </div>
                  )}
                </div>

                {/* Play button overlay */}
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="bg-accent-green/20 backdrop-blur-sm rounded-full p-6 
                                  group-hover:bg-accent-green/30 transition-all">
                    {isPlaying ? (
                      <Pause size={40} className="text-accent-green" />
                    ) : (
                      <Play size={40} className="text-accent-green ml-1" />
                    )}
                  </div>
                </button>
              </div>

              {/* Video controls */}
              <div className="bg-dark-secondary p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="text-accent-green hover:text-accent-green/80 transition-colors"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  
                  <div className="flex-1 bg-dark-primary rounded-full h-2 relative">
                    <div 
                      className="absolute left-0 top-0 h-full bg-accent-green rounded-full transition-all"
                      style={{ width: `${(currentStep + 1) * 20}%` }}
                    />
                  </div>
                  
                  <span className="text-sm text-text-secondary">
                    {workflowSteps[currentStep]?.time || '0:00'} / 0:30
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">What happens:</h3>
            
            {workflowSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-full text-left p-4 rounded-lg border transition-all
                  ${currentStep === index 
                    ? 'bg-accent-green/10 border-accent-green' 
                    : 'bg-dark-secondary/50 border-dark-secondary hover:border-accent-green/30'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    currentStep === index ? 'bg-accent-green/20' : 'bg-dark-primary'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-text-primary">{step.title}</h4>
                      <span className="text-xs text-text-secondary">{step.time}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{step.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-text-secondary mb-6">
            Stop wasting hours. Start building faster.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-green text-dark-primary 
                       rounded-lg font-medium text-lg hover:bg-accent-green/80 transition-all"
          >
            Start Your Free Trial
            <Clock size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}