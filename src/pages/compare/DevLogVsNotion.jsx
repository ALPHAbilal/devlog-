import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  X, 
  Code2, 
  Zap, 
  Shield, 
  Brain,
  Sparkles,
  ArrowRight,
  MessageSquare,
  GitBranch,
  HardDrive,
  Palette,
  Users,
  DollarSign
} from 'lucide-react';
import LogoMinimal from '../../components/LogoMinimal';

export default function DevLogVsNotion() {
  useEffect(() => {
    document.title = 'DevLog vs Notion for Developers - Detailed Comparison | DevLog';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = 'Compare DevLog vs Notion for developer documentation. See why developers choose DevLog for code snippets, AI conversations, and technical knowledge management.';
    }
  }, []);

  const comparisonData = [
    {
      category: 'Developer Features',
      features: [
        { 
          name: 'Syntax Highlighting', 
          devlog: true, 
          notion: 'partial',
          note: 'DevLog supports 100+ languages, Notion limited'
        },
        { 
          name: 'AI Conversation Saving', 
          devlog: true, 
          notion: false,
          note: 'Unique to DevLog'
        },
        { 
          name: 'Code Version Tracking', 
          devlog: true, 
          notion: false,
          note: 'Track code evolution over time'
        },
        { 
          name: 'Offline-First Architecture', 
          devlog: true, 
          notion: false,
          note: 'Work without internet connection'
        },
        { 
          name: 'Git Integration', 
          devlog: 'coming', 
          notion: false,
          note: 'Direct GitHub/GitLab sync'
        }
      ]
    },
    {
      category: 'Knowledge Management',
      features: [
        { 
          name: 'Wiki-Style Linking', 
          devlog: true, 
          notion: true,
          note: 'Both support [[wiki]] links'
        },
        { 
          name: 'Block-Based Editor', 
          devlog: true, 
          notion: true,
          note: 'Modular content blocks'
        },
        { 
          name: 'Developer-Focused Templates', 
          devlog: true, 
          notion: false,
          note: 'API docs, README templates'
        },
        { 
          name: 'Code-Aware Search', 
          devlog: true, 
          notion: false,
          note: 'Search inside code blocks'
        },
        { 
          name: 'Tag Organization', 
          devlog: true, 
          notion: 'partial',
          note: 'DevLog uses developer taxonomy'
        }
      ]
    },
    {
      category: 'Performance & Technical',
      features: [
        { 
          name: 'Load Time', 
          devlog: '< 1s', 
          notion: '2-4s',
          note: 'Offline-first = instant'
        },
        { 
          name: 'Data Ownership', 
          devlog: true, 
          notion: 'partial',
          note: 'Export all data anytime'
        },
        { 
          name: 'API Access', 
          devlog: true, 
          notion: true,
          note: 'Full REST API'
        },
        { 
          name: 'Markdown Support', 
          devlog: true, 
          notion: 'partial',
          note: 'Native MD import/export'
        },
        { 
          name: 'Storage Limit', 
          devlog: 'Unlimited', 
          notion: '5GB free',
          note: 'No file size restrictions'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/" className="flex items-center space-x-2">
              <LogoMinimal className="w-8 h-8" />
              <span className="text-xl font-semibold text-white">DevLog</span>
            </Link>
            <nav className="flex items-center space-x-8">
              <Link to="/features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link to="/auth" className="px-4 py-2 bg-accent-green text-dark-primary font-medium rounded-lg hover:bg-accent-green/90 transition-colors">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-green/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-accent-green/10 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-accent-green mr-2" />
              <span className="text-sm text-accent-green font-medium">In-Depth Comparison</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              DevLog vs Notion for Developers
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              While Notion is a great general-purpose tool, DevLog is built specifically for developers. 
              Compare features, performance, and pricing to make the right choice for your coding workflow.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-16 bg-dark-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* DevLog */}
            <div className="bg-dark-primary p-8 rounded-xl border-2 border-accent-green">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">DevLog</h3>
                <span className="px-3 py-1 bg-accent-green/20 text-accent-green rounded-full text-sm">
                  Built for Developers
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">AI conversation preservation</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">Code version tracking</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">Offline-first architecture</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">Developer-specific features</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">Lightning-fast performance</p>
                </div>
              </div>
              <Link to="/auth" className="mt-6 w-full block text-center px-6 py-3 bg-accent-green text-dark-primary font-medium rounded-lg hover:bg-accent-green/90 transition-colors">
                Try DevLog Free
              </Link>
            </div>

            {/* Notion */}
            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Notion</h3>
                <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                  General Purpose
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">All-in-one workspace</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">Database features</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">Team collaboration</p>
                </div>
                <div className="flex items-start space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">Limited code features</p>
                </div>
                <div className="flex items-start space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">No offline mode</p>
                </div>
              </div>
              <div className="mt-6 px-6 py-3 bg-gray-800 text-gray-400 text-center rounded-lg">
                General-purpose tool
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-xl text-gray-400">
              See how DevLog and Notion stack up across key features developers care about
            </p>
          </div>

          <div className="space-y-12">
            {comparisonData.map((category, idx) => (
              <div key={idx}>
                <h3 className="text-2xl font-semibold text-white mb-6">
                  {category.category}
                </h3>
                <div className="bg-dark-secondary rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-6 text-gray-400 font-medium">Feature</th>
                        <th className="text-center p-6 text-white font-medium">DevLog</th>
                        <th className="text-center p-6 text-white font-medium">Notion</th>
                        <th className="text-left p-6 text-gray-400 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.features.map((feature, featureIdx) => (
                        <tr key={featureIdx} className="border-b border-gray-800 last:border-0">
                          <td className="p-6 text-gray-300">{feature.name}</td>
                          <td className="p-6 text-center">
                            {feature.devlog === true ? (
                              <Check className="w-5 h-5 text-accent-green mx-auto" />
                            ) : feature.devlog === false ? (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            ) : feature.devlog === 'partial' ? (
                              <span className="text-yellow-500">Partial</span>
                            ) : feature.devlog === 'coming' ? (
                              <span className="text-blue-500">Coming Soon</span>
                            ) : (
                              <span className="text-gray-300">{feature.devlog}</span>
                            )}
                          </td>
                          <td className="p-6 text-center">
                            {feature.notion === true ? (
                              <Check className="w-5 h-5 text-gray-500 mx-auto" />
                            ) : feature.notion === false ? (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            ) : feature.notion === 'partial' ? (
                              <span className="text-yellow-500">Partial</span>
                            ) : (
                              <span className="text-gray-300">{feature.notion}</span>
                            )}
                          </td>
                          <td className="p-6 text-gray-500 text-sm">{feature.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <section className="py-20 bg-dark-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Developers Choose DevLog
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              DevLog isn't trying to be everything for everyone. We focus on what developers 
              actually need for managing their coding knowledge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <MessageSquare className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                AI Conversation Saver
              </h3>
              <p className="text-gray-400 mb-4">
                Unique to DevLog. Save ChatGPT, Claude, and other AI conversations directly. 
                Never lose valuable coding solutions from AI interactions.
              </p>
              <p className="text-sm text-accent-green">
                Notion: ❌ Not available
              </p>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <Code2 className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                True Code Support
              </h3>
              <p className="text-gray-400 mb-4">
                100+ language syntax highlighting, code-aware search, version tracking. 
                Built for code, not retrofitted.
              </p>
              <p className="text-sm text-accent-green">
                Notion: ⚠️ Basic only
              </p>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <HardDrive className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Offline-First
              </h3>
              <p className="text-gray-400 mb-4">
                Work without internet. All data stored locally with instant access. 
                Sync when connected. No loading spinners.
              </p>
              <p className="text-sm text-accent-green">
                Notion: ❌ Online only
              </p>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <Zap className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Lightning Performance
              </h3>
              <p className="text-gray-400 mb-4">
                &lt; 1 second load times. No waiting for servers. Instant search across 
                thousands of documents.
              </p>
              <p className="text-sm text-accent-green">
                Notion: 🐌 2-4s loads
              </p>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <GitBranch className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Version Tracking
              </h3>
              <p className="text-gray-400 mb-4">
                See how your code evolves. Track different approaches, compare solutions, 
                and learn from iterations.
              </p>
              <p className="text-sm text-accent-green">
                Notion: ❌ No versioning
              </p>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <Shield className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Data Ownership
              </h3>
              <p className="text-gray-400 mb-4">
                Your data, your control. Export everything anytime. No vendor lock-in. 
                Full API access.
              </p>
              <p className="text-sm text-accent-green">
                Notion: ⚠️ Limited export
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              When to Choose Each Tool
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Choose DevLog */}
            <div>
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Check className="w-8 h-8 text-accent-green mr-3" />
                Choose DevLog If You...
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Need to save and organize AI coding conversations
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Want proper syntax highlighting and code features
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Require offline access to your documentation
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Value speed and performance over features
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Want to track code evolution and versions
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Prefer developer-focused UI and workflows
                  </p>
                </li>
              </ul>
            </div>

            {/* Choose Notion */}
            <div>
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Check className="w-8 h-8 text-gray-500 mr-3" />
                Choose Notion If You...
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Need databases and project management features
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Want extensive templates for various use cases
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Collaborate with non-technical team members
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Require advanced formatting and design options
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Don't mind slower performance and online-only
                  </p>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Need an all-in-one workspace solution
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 bg-dark-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Pricing Comparison
            </h2>
            <p className="text-xl text-gray-400">
              Compare costs and value for developer workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* DevLog Pricing */}
            <div className="bg-dark-primary p-8 rounded-xl border-2 border-accent-green">
              <h3 className="text-2xl font-bold text-white mb-2">DevLog Pricing</h3>
              <p className="text-gray-400 mb-6">Simple, developer-friendly pricing</p>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-medium text-white">Starter</span>
                    <span className="text-2xl font-bold text-white">$0</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• 10 documents</li>
                    <li>• Basic features</li>
                    <li>• Community support</li>
                  </ul>
                </div>

                <div className="border-2 border-accent-green rounded-lg p-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-medium text-white">Pro</span>
                    <span className="text-2xl font-bold text-accent-green">$9/mo</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Unlimited documents</li>
                    <li>• All features</li>
                    <li>• Priority support</li>
                    <li>• API access</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-medium text-white">Team</span>
                    <span className="text-2xl font-bold text-white">$19/user</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Everything in Pro</li>
                    <li>• Team collaboration</li>
                    <li>• Admin controls</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Notion Pricing */}
            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-2">Notion Pricing</h3>
              <p className="text-gray-400 mb-6">Complex tiers with limitations</p>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-medium text-white">Personal</span>
                    <span className="text-2xl font-bold text-white">$0</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Limited blocks</li>
                    <li>• 5MB file uploads</li>
                    <li>• Basic features</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-medium text-white">Personal Pro</span>
                    <span className="text-2xl font-bold text-gray-300">$5/mo</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Unlimited blocks</li>
                    <li>• 5MB file uploads still</li>
                    <li>• 30 day version history</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-medium text-white">Team</span>
                    <span className="text-2xl font-bold text-gray-300">$10/user</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Collaboration features</li>
                    <li>• 100MB file uploads</li>
                    <li>• Admin tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-6">
              💡 <span className="text-white font-medium">Value Comparison:</span> DevLog Pro at $9/month includes 
              unlimited documents and all features. Notion Personal Pro at $5/month still has significant limitations.
            </p>
          </div>
        </div>
      </section>

      {/* Migration Guide */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Switching from Notion to DevLog
            </h2>
            <p className="text-xl text-gray-400">
              Migration is simple and takes less than 30 minutes
            </p>
          </div>

          <div className="bg-dark-secondary p-8 rounded-xl border border-gray-800">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent-green rounded-full flex items-center justify-center">
                  <span className="text-dark-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Export from Notion
                  </h3>
                  <p className="text-gray-400">
                    Settings → Export all workspace content → Markdown & CSV format
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent-green rounded-full flex items-center justify-center">
                  <span className="text-dark-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Import to DevLog
                  </h3>
                  <p className="text-gray-400">
                    Drag and drop your exported files or use our import tool
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent-green rounded-full flex items-center justify-center">
                  <span className="text-dark-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Organize & Enhance
                  </h3>
                  <p className="text-gray-400">
                    Add tags, enable syntax highlighting, and start saving AI conversations
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-dark-primary rounded-lg">
              <p className="text-sm text-gray-400">
                <span className="text-accent-green font-medium">Pro tip:</span> Start with your most 
                important developer documentation first. You don't need to migrate everything at once.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent-green/10 to-accent-green/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Switch to Developer-First Documentation?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of developers who've upgraded from Notion to DevLog. 
            Start your free 14-day trial and experience the difference.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/auth" className="px-8 py-4 bg-accent-green text-dark-primary font-medium rounded-lg hover:bg-accent-green/90 transition-colors text-lg">
              Start Free Trial
            </Link>
            <Link to="/demo" className="px-8 py-4 border border-gray-700 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors text-lg">
              View Demo
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            ✓ Import from Notion · ✓ 14-day free trial · ✓ No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <LogoMinimal className="w-6 h-6" />
              <span className="text-gray-400">© 2025 DevLog. All rights reserved.</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/compare" className="text-gray-400 hover:text-white transition-colors">
                Comparisons
              </Link>
              <a href="https://twitter.com/devlogapp" className="text-gray-400 hover:text-white transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}