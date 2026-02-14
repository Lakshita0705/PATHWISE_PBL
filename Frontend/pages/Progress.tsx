import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

const Progress: React.FC = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch roadmap modules (REAL SOURCE OF TRUTH)
      const { data: roadmapData } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user.id);

      setModules(roadmapData || []);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      setLoading(false);
    };

    fetchData();

    const onUpdate = () => {
      fetchData();
    };
    window.addEventListener("roadmapProgressUpdated", onUpdate);
    window.addEventListener("credibilityUpdated", onUpdate);
    return () => {
      window.removeEventListener("roadmapProgressUpdated", onUpdate);
      window.removeEventListener("credibilityUpdated", onUpdate);
    };
  }, []);

  /* ---------------- CALCULATIONS ---------------- */

  const totalModules = modules.length;
  const completedModules = modules.filter(m => m.is_completed).length;

  const overall =
    totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

  const circumference = 2 * Math.PI * 100;
  const strokeOffset = circumference - (circumference * overall) / 100;

  /* ------------------------------------------------ */

  if (loading) {
    return (
      <div className="text-center text-gray-400 mt-20">
        Loading performance analytics...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <h1 className="text-3xl font-bold text-white">
        Performance Analytics
      </h1>

      {totalModules === 0 && (
        <div className="text-gray-500 text-center mt-10">
          No roadmap generated yet. Start your roadmap to see analytics.
        </div>
      )}

      {totalModules > 0 && (
        <>
          {/* MAIN CARD */}
          <div className="glass rounded-3xl p-10 border border-white/10 flex flex-col md:flex-row gap-10 items-center">

            {/* Circular Progress */}
            <div className="relative">
              <svg className="w-56 h-56 transform -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="100"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="12"
                  fill="transparent"
                />
                <motion.circle
                  cx="112"
                  cy="112"
                  r="100"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: strokeOffset }}
                  transition={{ duration: 1.5 }}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">
                  {overall}%
                </span>
                <span className="text-gray-500 text-sm uppercase">
                  Overall
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Weekly Performance
                </h2>
                <p className="text-gray-400">
                  Based on your roadmap module completion.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xs text-gray-500 block mb-1">
                    Credibility Score
                  </span>
                  <span className="text-xl font-bold text-white">
                    {profile?.credibility_score || 0}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xs text-gray-500 block mb-1">
                    Modules Completed
                  </span>
                  <span className="text-xl font-bold text-white">
                    {completedModules} / {totalModules}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* WEEKLY BREAKDOWN */}
          <div className="glass rounded-3xl p-8 border border-white/5">
            <h3 className="text-xl font-bold mb-6 text-white">
              Module Breakdown
            </h3>

            <div className="space-y-5">
              {modules.map((module, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {module.title}
                    </span>
                    <span className="text-gray-500">
                      {module.is_completed ? "100%" : "0%"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: module.is_completed ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Progress;
