
import React, { useState } from 'react';
import { generateRoadmap } from "../services/roadmapGenerator";

import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Briefcase, ChevronRight, Rocket } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabaseClient';

interface RegisterProps {
  onRegister: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    careerGoal: 'Software Engineer',
    experienceLevel: 'Junior'
  });
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    // 1️⃣ Sign up user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.user) {
      alert("User creation failed");
      return;
    }

    // 2️⃣ Create profile in profiles table
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id, // MUST match auth.uid()
        name: formData.name,
        goal: formData.careerGoal,
        experience_level: formData.experienceLevel,
        skills: [],
        credibility_score: 0,
        level: 1,
        language: "English",
      },
    ]);

    if (profileError) {
      alert(profileError.message);
      return;
    }
    await generateRoadmap(data.user.id, formData.careerGoal);


    // 3️⃣ Navigate to dashboard
    navigate("/dashboard");

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 pt-24 relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full glass rounded-[2.5rem] p-10 md:p-12 border border-white/10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">Pathwise</span>
          </Link>
          <h2 className="text-3xl font-black mb-2 tracking-tight">Scale Your Future</h2>
          <p className="text-gray-400">Join elite professionals scaling their careers with AI</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white"
                  placeholder="Ishaan Gupta"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white"
                  placeholder="you@email.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Target Career Goal</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white appearance-none"
                value={formData.careerGoal}
                onChange={(e) => setFormData({...formData, careerGoal: e.target.value})}
              >
                <option value="Software Engineer" className="bg-[#0f0f0f]">Software Engineer</option>
                <option value="Data Scientist" className="bg-[#0f0f0f]">Data Scientist</option>
                <option value="Product Manager" className="bg-[#0f0f0f]">Product Manager</option>
                <option value="UX Designer" className="bg-[#0f0f0f]">UX Designer</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Current Level</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white appearance-none"
                value={formData.experienceLevel}
                onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
              >
                <option value="Entry" className="bg-[#0f0f0f]">Entry Level</option>
                <option value="Junior" className="bg-[#0f0f0f]">Junior</option>
                <option value="Intermediate" className="bg-[#0f0f0f]">Intermediate</option>
                <option value="Senior" className="bg-[#0f0f0f]">Senior</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-black text-white hover:opacity-90 transition-all neon-glow flex items-center justify-center gap-2 group"
          >
            Create My Career Path <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm">
          Already a member? <Link to="/login" className="text-purple-400 font-black hover:underline">Login here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
