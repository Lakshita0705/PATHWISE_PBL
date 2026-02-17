
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Map, 
  TrendingUp, 
  Users, 
  Layout, 
  Gamepad2, 
  ArrowRight, 
  Star,
  UserPlus,
  Cpu,
  Trophy,
  Rocket,
  ShieldCheck,
  Calendar,
  UserCheck
} from 'lucide-react';
import Footer from '../components/Footer';
import MentorApplicationForm from '../components/MentorApplicationForm';

const Home: React.FC = () => {
  const [isMentorFormOpen, setIsMentorFormOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background Graphics */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            rotate: [0, 360]
          }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 120, 0],
          }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[5%] w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full" 
        />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-24 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/20 text-purple-400 text-sm font-medium mb-8">
            <Star className="w-4 h-4 fill-purple-400" />
            <span>AI-Powered Career Transformation</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight">
            Elevate Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-400 to-purple-600">Trajectory</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The neural-link between where you are and where you deserve to be. 
            Automated roadmaps, elite mentors, and total career mastery.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/register" 
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-lg hover:scale-105 transition-all neon-glow flex items-center gap-3 group"
            >
              Start Free Journey <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/pricing" 
              className="px-10 py-5 rounded-2xl glass border border-white/10 text-white font-black text-lg hover:bg-white/5 transition-all"
            >
              Explore Plans
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Precision Engineered</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Our proprietary system optimizes every micro-step of your professional evolution.</p>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {[
            { icon: Sparkles, title: "AI Personalization Engine", desc: "Our neural engine adapts to your unique learning pace and background instantly.", color: "purple" },
            { icon: Map, title: "Dynamic Skill Roadmaps", desc: "Live-updating paths that evolve as market requirements and your skills change.", color: "blue" },
            { icon: TrendingUp, title: "Job Market Trend Analysis", desc: "Real-time data scraping ensures you are always learning the most valuable tools.", color: "green" },
            { icon: Users, title: "1-on-1 Mentorship", desc: "Direct access to industry leaders from NVIDIA, Stripe, and Google.", color: "orange" },
            { icon: Layout, title: "Progress Tracking Dashboard", desc: "A sleek command center to visualize your growth velocity and milestones.", color: "pink" },
            { icon: Gamepad2, title: "Gamified Learning", desc: "Earn XP, badges, and credibility scores that recruiters actually trust.", color: "indigo" }
          ].map((feat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="p-10 rounded-[2.5rem] glass border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center mb-8 text-purple-400 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <feat.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-4 group-hover:text-purple-400 transition-colors">{feat.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-32 relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent -translate-y-1/2 hidden lg:block" />
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">How It Works</h2>
          <p className="text-gray-400">Five steps to professional sovereignty.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
          {[
            { step: 1, icon: UserPlus, title: "Create Profile", desc: "Import your LinkedIn or CV and define your target position." },
            { step: 2, icon: Cpu, title: "AI Generates Roadmap", desc: "Get a bespoke 12-week plan tailored to your specific gap." },
            { step: 3, icon: Gamepad2, title: "Learn + Practice", desc: "Work through interactive modules and AI-graded projects." },
            { step: 4, icon: Users, title: "Connect with Mentors", desc: "Unlock elite mentors once your credibility hits the threshold." },
            { step: 5, icon: Trophy, title: "Track Progress & Level Up", desc: "Visualize your growth and launch your new career phase." }
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 text-white font-black text-xl shadow-xl group-hover:scale-110 transition-transform relative">
                <div className="absolute -inset-2 bg-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                {step.step}
              </div>
              <div className="mb-4 flex justify-center text-purple-400">
                <step.icon size={24} />
              </div>
              <h4 className="font-black text-lg mb-2">{step.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mentorship Section Preview */}
      <section className="container mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
          <div className="text-left">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Elite Mentorship</h2>
            <p className="text-gray-400 text-lg">Direct access to industry leaders from the world's most innovative companies.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMentorFormOpen(true)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity group"
            >
              <UserCheck size={18} />
              Become a Mentor
            </button>
            <Link to="/mentorship" className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-bold flex items-center gap-2 group">
              View All Mentors <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Ananya Sharma", role: "Principal Architect", company: "NVIDIA", rating: 5.0, skills: ["AI Systems", "Scaling"], credibility: 75 },
            { name: "Rohan Mehra", role: "Sr. Product Designer", company: "Linear", rating: 4.9, skills: ["UX Design", "Product"], credibility: 60 },
            { name: "Vikram Malhotra", role: "Staff Engineer", company: "Stripe", rating: 5.0, skills: ["Go", "Distributed Systems"], credibility: 85 }
          ].map((mentor, i) => (
            <div key={i} className="glass rounded-3xl p-8 border border-white/5 hover:border-purple-500/20 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-1">
                  <div className="w-full h-full rounded-xl bg-zinc-900 flex items-center justify-center text-3xl">👤</div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 font-bold text-xs">
                  <Star size={14} className="fill-current" /> {mentor.rating}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">{mentor.name}</h3>
              <p className="text-sm text-purple-400 font-medium mb-4">{mentor.role} at <span className="text-white">{mentor.company}</span></p>
              
              <div className="flex flex-wrap gap-2 mb-8 flex-1">
                {mentor.skills.map(s => (
                  <span key={s} className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s}</span>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-white/5">
                <button className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                  <Calendar size={16} /> Book Session
                </button>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span>Unlocked at {mentor.credibility} Credibility</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MentorApplicationForm
        isOpen={isMentorFormOpen}
        onClose={() => setIsMentorFormOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default Home;
