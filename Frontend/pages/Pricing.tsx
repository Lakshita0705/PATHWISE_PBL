
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Sparkles, Rocket } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Pathfinder',
      price: '0',
      desc: 'Perfect for exploring and starting your career transition.',
      features: [
        'Limited Roadmap Modules',
        'Basic Skill Assessment',
        'Community Forum Access'
      ],
      cta: 'Start for Free',
      popular: false
    },
    {
      name: 'Architect',
      price: '499',
      desc: 'Deep learning path with AI guidance for serious growth.',
      features: [
        'Full Roadmap Access',
        'AI Mentor Matching',
        'Advanced Credibility Engine',
        'Best Recommendations',
        'Priority Access to Mentors'
      ],
      cta: 'Go Pro Now',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '799',
      desc: 'Bespoke coaching and team-level development suites.',
      features: [
        '1-on-1 Executive Coaching',
        'Custom Roadmaps',
        'Team Performance Metrics',
        'Priority Access to Mentors',
        'AI Mentor Matching',
        'Best Recommendations',
        'Lifetime Access'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="pt-32 pb-24 container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h1 className="text-4xl md:text-6xl font-black mb-6">Invest in Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Future</span></h1>
        <p className="text-xl text-gray-400 leading-relaxed">Join 50,000+ professionals building their dream careers with the speed of AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-8 rounded-[2.5rem] glass border flex flex-col transition-all group
              ${plan.popular ? 'border-purple-500 scale-105 shadow-[0_0_50px_rgba(168,85,247,0.15)] z-10' : 'border-white/10 hover:border-white/20'}`}
          >
            {plan.popular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Most Popular
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{plan.desc}</p>
            </div>

            <div className="mb-10 flex items-baseline gap-1">
              <span className="text-4xl font-black">₹</span>
              <span className="text-6xl font-black">{plan.price}</span>
              <span className="text-gray-500 font-bold">/mo</span>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-sm text-gray-300">{feat}</span>
                </div>
              ))}
            </div>

            <button className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2
              ${plan.popular 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white neon-glow hover:opacity-90' 
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
              {plan.cta} {plan.popular && <Zap className="w-4 h-4" />}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Money back badge */}
      <div className="mt-20 flex flex-col items-center gap-4 text-center">
         <div className="flex items-center gap-4 p-4 rounded-2xl glass border border-white/5">
            <Rocket className="text-purple-500 w-8 h-8" />
            <div className="text-left">
               <p className="font-bold">30-Day Velocity Guarantee</p>
               <p className="text-xs text-gray-500">Not feeling the acceleration? 100% instant refund, no questions asked.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Pricing;
