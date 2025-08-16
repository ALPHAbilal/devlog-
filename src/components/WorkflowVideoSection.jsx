import { useState } from 'react';
import { Play, Pause, Terminal, Code2, FileText, Hash, Link2, CheckCircle, Save } from 'lucide-react';

const workflowSteps = [
  {
    time: '0:00',
    title: 'Encounter a problem',
    description: 'CORS error blocks your API call',
    icon: <Terminal className="text-red-400" size={20} />
  },
  {
    time: '0:05',
    title: 'Solve it (the hard way)',
    description: 'Research, debug, test different solutions',
    icon: <Code2 className="text-yellow-400" size={20} />
  },
  {
    time: '0:15',
    title: 'Document immediately',
    description: 'Create a DevLog entry while it\'s fresh',
    icon: <FileText className="text-accent-green" size={20} />
  },
  {
    time: '0:25',
    title: 'Add context & code',
    description: 'Include working solution with explanation',
    icon: <Save className="text-blue-400" size={20} />
  },
  {
    time: '0:35',
    title: 'Tag & link',
    description: 'Connect to related docs (#cors, [[Auth Setup]])',
    icon: <Link2 className="text-purple-400" size={20} />
  },
  {
    time: '0:45',
    title: 'Find instantly next time',
    description: 'Search "cors" → Your solution appears',
    icon: <CheckCircle className="text-accent-green" size={20} />
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
            From Problem to <span className="text-accent-green">Permanent Solution</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Watch how DevLog transforms your debugging sessions into a growing knowledge base. 
            Document once, benefit forever.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video player */}
          <div className="lg:col-span-2">
            <div className="relative bg-dark-primary rounded-lg overflow-hidden shadow-2xl">
              {/* Video placeholder showing documentation process */}
              <div className="aspect-video bg-gradient-to-br from-dark-secondary to-dark-primary 
                              flex items-center justify-center relative">
                {/* DevLog editor mockup */}
                <div className="absolute inset-4 bg-black/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-text-secondary ml-2">DevLog Editor</span>
                  </div>
                  
                  {currentStep >= 2 && (
                    <div className="space-y-3">
                      <h3 className="text-text-primary font-medium">
                        {currentStep >= 3 ? 'Fixed CORS error in production' : 'New Document'}
                      </h3>
                      
                      {currentStep >= 4 && (
                        <>
                          <div className="flex gap-2">
                            <span className="text-xs px-2 py-1 bg-accent-green/20 text-accent-green rounded">
                              #cors
                            </span>
                            <span className="text-xs px-2 py-1 bg-accent-green/20 text-accent-green rounded">
                              #express
                            </span>
                          </div>
                          
                          <div className="bg-black/30 rounded p-2 font-mono text-xs text-accent-green">
                            <pre>{`app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));`}</pre>
                          </div>
                        </>
                      )}
                      
                      {currentStep >= 5 && (
                        <p className="text-sm text-text-secondary">
                          Related: <span className="text-accent-green">[[Authentication Setup]]</span>
                        </p>
                      )}
                    </div>
                  )}
                  
                  {currentStep < 2 && (
                    <div className="text-red-400 font-mono text-sm">
                      Error: Access to fetch at 'https://api.example.com' blocked by CORS
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
                      style={{ width: `${(currentStep + 1) * 16.67}%` }}
                    />
                  </div>
                  
                  <span className="text-sm text-text-secondary">
                    {workflowSteps[currentStep]?.time || '0:00'} / 1:00
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">The DevLog Workflow:</h3>
            
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

        {/* Key benefits */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">2 minutes</div>
            <p className="text-text-secondary">Average time to document a solution properly</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">2 hours</div>
            <p className="text-text-secondary">Saved when you encounter it again</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">∞ value</div>
            <p className="text-text-secondary">Compounds as your knowledge base grows</p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-text-secondary mb-6">
            Stop losing your hard-won solutions. Start building your second brain.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-green text-dark-primary 
                       rounded-lg font-medium text-lg hover:bg-accent-green/80 transition-all"
          >
            Start Documenting Today
            <FileText size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}