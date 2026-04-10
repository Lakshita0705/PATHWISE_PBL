
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Github, Chrome, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MentorLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    const authedUser = data.user;
    if (!authedUser) {
      setError("Login failed. Please try again.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authedUser.id)
      .single();

    if (profileError) {
      setError(profileError.message);
      return;
    }

    if (profile?.role === "mentor") {
      navigate("/mentor-dashboard");
      return;
    }

    const { data: application } = await supabase
      .from("mentor_applications")
      .select("status")
      .eq("applicant_user_id", authedUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (application?.status === "pending") {
      navigate("/mentor-pending");
      return;
    }

    await supabase.auth.signOut();
    setError("Application not approved yet. Please apply as mentor or wait for admin approval.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-[#0a0a0a]">
      {/* Background Graphic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">Pathwise<span className="text-blue-500">Mentor</span></span>
          </Link>
          <h2 className="text-3xl font-black mb-2 tracking-tight">Mentor Portal</h2>
          <p className="text-gray-400">Share your wisdom, shape the future</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Professional Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                placeholder="sarah.chen@google.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Security Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}

          <button 
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl font-black text-white hover:opacity-90 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Access Dashboard
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Verify with</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold">
            <Github className="w-5 h-5" /> GitHub
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold">
            <Chrome className="w-5 h-5 text-blue-400" /> Google
          </button>
        </div>

        <p className="mt-10 text-center text-gray-400 text-sm">
          Want to become a mentor? <Link to="/mentor-register" className="text-blue-400 font-black hover:underline">Apply Now</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default MentorLogin;
