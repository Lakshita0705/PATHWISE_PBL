import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Brain,
  Code,
  Database,
  Shield,
} from "lucide-react";

const paths = [
  {
    title: "AI Engineer",
    value: "AI",
    icon: Brain,
    description: "Machine Learning, LLMs, Neural Networks",
  },
  {
    title: "Full Stack Developer",
    value: "FullStack",
    icon: Code,
    description: "Frontend, Backend, DevOps",
  },
  {
    title: "Data Scientist",
    value: "DataScience",
    icon: Database,
    description: "Analytics, ML, Visualization",
  },
  {
    title: "Cybersecurity",
    value: "CyberSecurity",
    icon: Shield,
    description: "Security, Ethical Hacking",
  },
];

const CareerPaths: React.FC = () => {
  const navigate = useNavigate();

  const selectPath = async (topic: string) => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    const userId = data.user.id;

    // 1️⃣ Update profile goal
    await supabase
      .from("profiles")
      .update({ goal: topic })
      .eq("id", userId);

    // 2️⃣ Delete old roadmap
    await supabase
      .from("roadmaps")
      .delete()
      .eq("user_id", userId);

    // 3️⃣ Redirect to dashboard (will auto-generate)
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-black text-white text-center mb-12">
          Choose Your Career Path
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {paths.map((path) => (
            <div
              key={path.value}
              onClick={() => selectPath(path.value)}
              className="p-8 rounded-3xl glass border border-white/10 hover:border-purple-500/30 cursor-pointer transition-all hover:scale-105"
            >
              <path.icon className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                {path.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {path.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerPaths;
