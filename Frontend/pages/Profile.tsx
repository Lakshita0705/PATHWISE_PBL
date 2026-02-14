import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Camera,
  Save,
  Globe,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import learningPaths from "../data/learningPath.json";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    careerGoal: "",
    experienceLevel: "Junior",
    skills: "",
  });

  const careerOptions = [
    ...learningPaths.map((p: any) => p.topic),
    "AI Engineer",
    "Full Stack Developer",
    "Data Scientist",
    "Cybersecurity",
  ].filter((v, i, a) => a.indexOf(v) === i);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      setAuthEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData({
          name: profile.name ?? "",
          careerGoal: profile.goal ?? "",
          experienceLevel: profile.experience_level ?? "Junior",
          skills: Array.isArray(profile.skills)
            ? profile.skills.join(", ")
            : typeof profile.skills === "string"
            ? profile.skills
            : "",
        });
      }

      setLoading(false);
    };

    load();
  }, [navigate]);

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const skillsArray = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        goal: formData.careerGoal,
        experience_level: formData.experienceLevel,
        skills: skillsArray,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      alert("Failed to update profile: " + error.message);
      return;
    }
    alert("Profile updated successfully!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    window.dispatchEvent(new Event("popstate"));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-20 flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile Info Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="glass rounded-3xl p-8 border border-white/10 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 p-1">
                <div className="w-full h-full rounded-[1.4rem] bg-[#0f0f0f] flex items-center justify-center overflow-hidden">
                  <UserIcon className="w-12 h-12 text-purple-400" />
                </div>
              </div>
              <button
                type="button"
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white/10 border border-white/10 hover:bg-purple-600 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white">{formData.name || "User"}</h3>
            <p className="text-sm text-gray-500 mb-6">{formData.careerGoal || "—"}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">
                Active Path
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">
                Pro Tier
              </span>
            </div>
          </div>

          <div className="glass rounded-3xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {[
              { icon: Globe, label: "Language", val: "English (US)" },
              { icon: Bell, label: "Notifications", val: "Enabled" },
              { icon: Shield, label: "Security", val: "2FA Active" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-5 hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                  <span className="text-sm text-gray-300 font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{item.val}</span>
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-3xl p-8 border border-white/10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={authEmail}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email is managed by your account.</p>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Career Goal
                </label>
                <select
                  value={formData.careerGoal}
                  onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white"
                >
                  <option value="" className="bg-[#0f0f0f]">Select a path</option>
                  {careerOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0f0f0f]">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, experienceLevel: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white"
                >
                  <option value="Entry" className="bg-[#0f0f0f]">Entry</option>
                  <option value="Junior" className="bg-[#0f0f0f]">Junior</option>
                  <option value="Intermediate" className="bg-[#0f0f0f]">Intermediate</option>
                  <option value="Senior" className="bg-[#0f0f0f]">Senior</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Active Skills (comma separated)
                </label>
                <textarea
                  rows={4}
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
