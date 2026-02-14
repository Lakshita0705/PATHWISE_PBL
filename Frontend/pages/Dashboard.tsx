import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Zap,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

import { recalculateMetrics } from "../lib/metricsEngine";
import { getDifficulty } from "../lib/personalizationEngine";
import { generateRoadmap } from "../lib/roadmapGenerator";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    /* ---------------- GET USER ---------------- */

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) return;

    /* ---------------- FETCH PROFILE ---------------- */

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileData) return;

    setProfile(profileData);

    /* ---------------- CHECK GOAL ---------------- */

    if (!profileData.goal) {
      navigate("/paths");
      return;
    }

    /* ---------------- RECALCULATE METRICS ---------------- */

    await recalculateMetrics(user.id);

    /* ---------------- FETCH ROADMAP ---------------- */

    const { data: roadmapByGoal } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .eq("topic", profileData.goal)
      .order("order_index", { ascending: true });

    let roadmap = roadmapByGoal || [];

    // If no roadmap for goal topic, use any roadmap the user has (e.g. from Roadmap page)
    if (roadmap.length === 0) {
      const { data: allRoadmaps } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });
      if (allRoadmaps && allRoadmaps.length > 0) {
        const firstTopic = allRoadmaps[0].topic;
        roadmap = allRoadmaps.filter((r: any) => r.topic === firstTopic);
      }
    }

    setProgressData(roadmap);

    /* ---------------- CALCULATE METRICS FOR NN ---------------- */

    const engagement = roadmap?.length * 5 || 0;

    const velocity =
      roadmap?.length > 0
        ? roadmap.reduce(
            (acc: number, item: any) =>
              acc + (item.is_completed ? 10 : 0),
            0
          )
        : 0;

    const mastery = 70; // placeholder until quiz avg implemented

    const experienceNumber =
      profileData.experience_level === "Entry"
        ? 0
        : profileData.experience_level === "Junior"
        ? 1
        : profileData.experience_level === "Intermediate"
        ? 2
        : 3;

    /* ---------------- CALL PERSONALIZATION ENGINE ---------------- */

    const difficulty = await getDifficulty({
      engagement,
      velocity,
      mastery,
      credibility: profileData.credibility_score || 0,
      experience: experienceNumber,
    });

    console.log("Predicted Difficulty:", difficulty);

    /* ---------------- GENERATE ROADMAP IF MISSING ---------------- */

    if (roadmap.length === 0) {
      await generateRoadmap(user.id, profileData.goal, difficulty);

      // Refetch after generation
      const { data: newRoadmap } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .eq("topic", profileData.goal)
        .order("order_index", { ascending: true });

      setProgressData(newRoadmap || []);
    }

    /* ---------------- FETCH ACTIVITY ---------------- */

    const { data: logs } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setActivity(logs || []);
  };

  useEffect(() => {
    fetchData();

    const onProgressUpdate = () => {
      fetchData();
    };
    window.addEventListener("roadmapProgressUpdated", onProgressUpdate);
    window.addEventListener("credibilityUpdated", onProgressUpdate);
    return () => {
      window.removeEventListener("roadmapProgressUpdated", onProgressUpdate);
      window.removeEventListener("credibilityUpdated", onProgressUpdate);
    };
  }, [navigate]);

  /* ---------------- DASHBOARD CALCULATIONS ---------------- */

  const totalModules = progressData.length;

  const completedModules = progressData.filter(
    (m) => m.is_completed
  ).length;

  const weeklyProgress =
    totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

  const studyHours = completedModules * 1.5;

  const chartData = progressData.map((item, i) => ({
    name: item.title || `Step ${(item.order_index ?? i) + 1}`,
    progress: item.is_completed ? 100 : 0,
    fullMark: 100,
  }));

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {profile?.name || "User"}
        </h1>
        <p className="text-gray-400 mt-1">
          Goal:{" "}
          <span className="text-purple-400 font-medium">
            {profile?.goal}
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Progress",
            value: `${weeklyProgress}%`,
            icon: Zap,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
          },
          {
            label: "Modules Completed",
            value: completedModules,
            icon: CheckCircle,
            color: "text-green-400",
            bg: "bg-green-400/10",
          },
          {
            label: "Study Hours",
            value: `${studyHours}h`,
            icon: Clock,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
          {
            label: "Credibility",
            value: profile?.credibility_score || 0,
            icon: Award,
            color: "text-purple-400",
            bg: "bg-purple-400/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 glass rounded-2xl border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">
              {stat.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div className="lg:col-span-2 glass rounded-3xl p-8 border border-white/5 min-h-[380px]">
          <h3 className="text-xl font-bold mb-6 text-white">
            Velocity Analytics
          </h3>

          {chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center rounded-xl bg-white/5 border border-white/5">
              <p className="text-gray-500 text-sm">
                Complete roadmap steps to see your progress here.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(v) => (v.length > 18 ? `${v.slice(0, 18)}…` : v)}
                />
                <YAxis
                  stroke="#6b7280"
                  domain={[0, 100]}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Progress"]}
                  contentStyle={{ background: "rgba(30,30,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  name="Progress"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#progressGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Activity */}
        <motion.div className="glass rounded-3xl p-8 border border-white/5">
          <h3 className="text-xl font-bold mb-6 text-white">
            Recent Activity
          </h3>

          {activity.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No recent activity.
            </p>
          ) : (
            activity.map((log, i) => (
              <div key={i} className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {log.action === "MODULE_COMPLETED" && log.metadata?.title
                      ? `Completed: ${log.metadata.title}`
                      : log.action}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
