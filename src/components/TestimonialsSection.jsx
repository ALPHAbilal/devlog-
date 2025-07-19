import { Star, Quote } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Senior Frontend Developer',
      company: 'TechCorp',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      content: 'Devlog transformed how I document my learning. I used to lose track of solutions in Slack and random notes. Now everything is searchable and connected. It\'s like having a personal Stack Overflow.',
      rating: 5,
      highlight: 'personal Stack Overflow'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Full Stack Engineer',
      company: 'StartupXYZ',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      content: 'The AI conversation preservation is a game-changer. I save all my ChatGPT debugging sessions and can search them months later. Saved me countless hours of re-solving the same problems.',
      rating: 5,
      highlight: 'game-changer'
    },
    {
      name: 'Emily Thompson',
      role: 'DevOps Lead',
      company: 'CloudScale',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
      content: 'Finally, a tool that thinks like developers. The code versioning and file path tracking means I can see how my solutions evolved. It\'s become essential for our team\'s knowledge sharing.',
      rating: 5,
      highlight: 'thinks like developers'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Documents Created' },
    { value: '2.5M', label: 'Code Blocks Saved' },
    { value: '98%', label: 'User Satisfaction' },
    { value: '<200ms', label: 'Avg Search Time' }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">
            Loved by Developers Worldwide
          </h3>
          <p className="text-text-secondary text-lg">
            Join thousands of developers who've transformed their knowledge management
          </p>
        </div>

        {/* Stats */}
        <div className="fluid-grid-stats mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-accent-green mb-1">{stat.value}</div>
              <div className="text-text-secondary text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="fluid-grid-testimonials mb-12">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-dark-secondary/30 rounded-lg p-6 border border-dark-secondary/50 
                         hover:border-accent-green/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full bg-dark-primary"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-text-secondary">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>

              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-accent-green text-accent-green" />
                ))}
              </div>

              <Quote size={20} className="text-accent-green/20 mb-2" />
              
              <p className="text-text-secondary leading-relaxed">
                {testimonial.content.split(testimonial.highlight).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="text-accent-green font-medium">
                        {testimonial.highlight}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

        {/* Company Logos */}
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-6">
            Trusted by developers at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
            {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix'].map((company) => (
              <div
                key={company}
                className="text-2xl font-bold text-text-secondary/50 hover:text-text-secondary 
                           transition-all hover:scale-110"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}