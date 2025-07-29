import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Brain, 
  Code2, 
  Zap, 
  Shield, 
  Search,
  FolderOpen,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Users
} from 'lucide-react';
import LogoMinimal from '../../components/LogoMinimal';

export default function AIConversationManagement() {
  useEffect(() => {
    document.title = 'AI Conversation Saver - Manage ChatGPT & Claude Chats | DevLog';
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = 'Save, organize, and search your AI conversations from ChatGPT, Claude, and other AI tools. Never lose valuable coding solutions again with DevLog\'s AI conversation management system.';
    }
  }, []);

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
              <Link to="/guides" className="text-gray-300 hover:text-white transition-colors">
                Guides
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
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-accent-green/10 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-accent-green mr-2" />
              <span className="text-sm text-accent-green font-medium">Complete Guide</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              AI Conversation Management for Developers
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Learn how to save, organize, and leverage your ChatGPT, Claude, and other AI conversations 
              to build your personal coding knowledge base.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/auth" className="px-6 py-3 bg-accent-green text-dark-primary font-medium rounded-lg hover:bg-accent-green/90 transition-colors">
                Start Free Trial
              </Link>
              <Link to="#why-save" className="px-6 py-3 border border-gray-700 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Save AI Conversations */}
      <section id="why-save" className="py-20 bg-dark-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Save AI Conversations?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Every AI conversation contains valuable solutions, explanations, and code snippets 
              that disappear when you close the chat. Here's why preserving them matters.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <Brain className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Knowledge Retention
              </h3>
              <p className="text-gray-400">
                AI helps solve complex problems, but those solutions are lost forever once the 
                conversation ends. Save them to build your coding knowledge base.
              </p>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <Search className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Instant Retrieval
              </h3>
              <p className="text-gray-400">
                Remember that perfect solution from last month? With proper organization, 
                find any past AI conversation in seconds, not hours of searching.
              </p>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <GitBranch className="w-12 h-12 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Solution Evolution
              </h3>
              <p className="text-gray-400">
                Track how your solutions evolve over time. See which AI suggestions worked, 
                which didn't, and build upon successful patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How DevLog Helps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                How DevLog Transforms AI Conversations
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                DevLog isn't just a storage solution—it's a complete system for turning 
                AI conversations into actionable, searchable knowledge.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle2 className="w-6 h-6 text-accent-green flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      One-Click Import
                    </h3>
                    <p className="text-gray-400">
                      Copy and paste any AI conversation directly into DevLog. Our smart parser 
                      automatically formats and organizes the content.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle2 className="w-6 h-6 text-accent-green flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Intelligent Organization
                    </h3>
                    <p className="text-gray-400">
                      Tag conversations by topic, language, or project. Create collections 
                      for different problem domains or technologies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle2 className="w-6 h-6 text-accent-green flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Code-Aware Search
                    </h3>
                    <p className="text-gray-400">
                      Search through code snippets, explanations, and solutions across all 
                      your saved conversations with syntax-aware search.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle2 className="w-6 h-6 text-accent-green flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Version Tracking
                    </h3>
                    <p className="text-gray-400">
                      See how solutions evolve. Track which approaches worked and build 
                      upon successful implementations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-secondary p-8 rounded-xl border border-gray-800">
              <div className="space-y-4">
                <div className="bg-dark-primary p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">ChatGPT Conversation</span>
                  </div>
                  <code className="text-sm text-gray-400 block">
                    How to implement debounce in React?
                  </code>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-accent-green" />
                </div>

                <div className="bg-dark-primary p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <FolderOpen className="w-5 h-5 text-accent-green" />
                    <span className="text-sm font-medium text-gray-300">DevLog Document</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Code2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">React Debounce Hook</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">Performance Optimization</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="py-20 bg-dark-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Complete Setup Guide
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Get started with AI conversation management in minutes. Follow these simple steps 
              to never lose valuable coding solutions again.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-green rounded-full flex items-center justify-center">
                  <span className="text-dark-primary font-bold">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Create Your DevLog Account
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Sign up for a free 14-day trial. No credit card required. Get instant access 
                    to all features including unlimited AI conversation storage.
                  </p>
                  <Link to="/auth" className="inline-flex items-center text-accent-green hover:text-accent-green/80">
                    Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-green rounded-full flex items-center justify-center">
                  <span className="text-dark-primary font-bold">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Import Your First Conversation
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Copy any ChatGPT, Claude, or AI conversation. Create a new document in DevLog 
                    and paste. Our parser automatically formats code blocks and preserves context.
                  </p>
                  <div className="bg-dark-primary p-4 rounded-lg border border-gray-800">
                    <code className="text-sm text-gray-300">
                      1. Select all (Cmd/Ctrl + A) in your AI chat<br/>
                      2. Copy (Cmd/Ctrl + C)<br/>
                      3. Paste into DevLog AI block<br/>
                      4. Auto-formatting applied instantly
                    </code>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-green rounded-full flex items-center justify-center">
                  <span className="text-dark-primary font-bold">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Organize with Tags and Folders
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Add tags like #react, #performance, or #debugging. Create project folders 
                    to group related conversations. Build your personal knowledge taxonomy.
                  </p>
                  <div className="flex space-x-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                      #react-hooks
                    </span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                      #optimization
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                      #typescript
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-green rounded-full flex items-center justify-center">
                  <span className="text-dark-primary font-bold">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Search and Reference
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Use powerful search to find any conversation instantly. Search by code content, 
                    error messages, or concepts. Link related conversations together.
                  </p>
                  <div className="bg-dark-primary p-4 rounded-lg border border-gray-800">
                    <div className="flex items-center space-x-3">
                      <Search className="w-5 h-5 text-gray-500" />
                      <input 
                        type="text" 
                        className="bg-transparent text-gray-300 outline-none"
                        placeholder="Search: useEffect cleanup function"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Best Practices for AI Conversation Management
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Maximize the value of your saved AI conversations with these proven strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-dark-secondary p-8 rounded-xl border border-gray-800">
              <BookOpen className="w-10 h-10 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Document Context
              </h3>
              <p className="text-gray-400 mb-4">
                Always include the problem context when saving conversations. Future you 
                will thank present you for explaining why this solution was needed.
              </p>
              <div className="bg-dark-primary p-4 rounded-lg">
                <p className="text-sm text-gray-500 italic">
                  "Needed to optimize React re-renders in dashboard component with 500+ items"
                </p>
              </div>
            </div>

            <div className="bg-dark-secondary p-8 rounded-xl border border-gray-800">
              <Zap className="w-10 h-10 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Extract Key Insights
              </h3>
              <p className="text-gray-400 mb-4">
                After saving, add a summary block highlighting the key takeaways. This makes 
                future searches more effective and learning faster.
              </p>
              <div className="bg-dark-primary p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  Key: useMemo for expensive computations, React.memo for component optimization
                </p>
              </div>
            </div>

            <div className="bg-dark-secondary p-8 rounded-xl border border-gray-800">
              <Code2 className="w-10 h-10 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Version Your Solutions
              </h3>
              <p className="text-gray-400 mb-4">
                When you find better solutions, don't delete old ones. Keep them with notes 
                about what improved. This creates a learning trail.
              </p>
              <div className="bg-dark-primary p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  v1: Basic debounce → v2: Custom hook → v3: With cleanup
                </p>
              </div>
            </div>

            <div className="bg-dark-secondary p-8 rounded-xl border border-gray-800">
              <Users className="w-10 h-10 text-accent-green mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Share Knowledge
              </h3>
              <p className="text-gray-400 mb-4">
                Create shareable links for valuable conversations. Help your team learn from 
                AI interactions without repeating the same questions.
              </p>
              <div className="bg-dark-primary p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  devlog.design/shared/react-performance-tips
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-dark-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Real-World Use Cases
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              See how developers use DevLog to manage AI conversations in their daily workflow.
            </p>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-3">
                Debugging Complex Issues
              </h3>
              <p className="text-gray-400 mb-4">
                When debugging production issues, AI conversations often contain valuable diagnostic 
                steps and solutions. Save these for future similar issues.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">Common saves:</span>
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded">
                  Memory leaks
                </span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded">
                  Performance issues
                </span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                  Race conditions
                </span>
              </div>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-3">
                Learning New Technologies
              </h3>
              <p className="text-gray-400 mb-4">
                AI excels at explaining new concepts and providing examples. Build a personal 
                learning library from your AI conversations about new frameworks and languages.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">Popular topics:</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded">
                  Next.js
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded">
                  Rust
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded">
                  GraphQL
                </span>
              </div>
            </div>

            <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-3">
                Code Review Insights
              </h3>
              <p className="text-gray-400 mb-4">
                Use AI for code reviews and save the feedback. Build a collection of best practices 
                and common improvements specific to your codebase.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">Review topics:</span>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded">
                  Security
                </span>
                <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded">
                  Architecture
                </span>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded">
                  Testing
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent-green/10 to-accent-green/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start Building Your AI Knowledge Base Today
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of developers who never lose valuable AI conversations. 
            Free 14-day trial, no credit card required.
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
            ✓ 14-day free trial · ✓ No credit card required · ✓ Cancel anytime
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
              <Link to="/guides" className="text-gray-400 hover:text-white transition-colors">
                Guides
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