
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ShieldCheck, Briefcase, Award, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MentorRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    expertise: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password || !formData.company) {
      setError('Please fill in all required fields');
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    if (!data.user) {
      setError("User creation failed");
      return;
    }

    const expertise = formData.expertise
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        name: formData.name,
        role: "student",
        goal: null,
        experience_level: null,
        skills: expertise,
        credibility_score: 0,
        level: 1,
        language: "English",
      },
    ]);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    const { error: applicationError } = await supabase.from("mentor_applications").insert([
      {
        applicant_user_id: data.user.id,
        full_name: formData.name,
        email: formData.email,
        educational_qualification: formData.company,
        stream_of_mentoring: expertise[0] || "General Mentorship",
        certificate_url: null,
        status: "pending",
      },
    ]);

    if (applicationError) {
      setError(applicationError.message);
      return;
    }

    navigate("/mentor-pending");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-[#0a0a0a]">
      {/* Background Graphic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full glass rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">Pathwise<span className="text-blue-500">Mentor</span></span>
          </Link>
          <h2 className="text-3xl font-black mb-2 tracking-tight">Join the Elite</h2>
          <p className="text-gray-400">Apply to become a verified mentor on Pathwise</p>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  placeholder="Dr. Sarah Chen"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  placeholder="sarah@google.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Current Company/Role</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  placeholder="Senior AI Scientist at OpenAI"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Expertise (comma separated)</label>
              <div className="relative">
                <Award className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  value={formData.expertise}
                  onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  placeholder="NLP, PyTorch, LLMs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Short Bio</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white h-[118px] resize-none"
                placeholder="Tell us about your journey..."
              />
            </div>
          </div>

          <div className="md:col-span-2">
            {error && <p className="text-red-400 text-sm text-center font-medium mb-4">{error}</p>}

            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl font-black text-white hover:opacity-90 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
            >
              Submit Application <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-gray-400 text-sm">
          Already a mentor? <Link to="/mentor-login" className="text-blue-400 font-black hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default MentorRegister;
