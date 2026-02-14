import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";
import {
  Play,
  HelpCircle,
  FileCode,
  Check,
  Lock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Video,
  GraduationCap,
  FolderOpen,
} from "lucide-react";

import learningPaths from "../data/learningPath.json";
import { recalculateMetrics } from "../lib/metricsEngine";
import { updateCredibility } from "../services/profileService";

const Roadmap: React.FC = () => {
  const [roadmapData, setRoadmapData] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [expandedResources, setExpandedResources] = useState<Set<number>>(new Set());

  /* ---------------- FETCH USER + ROADMAP ---------------- */

  const fetchRoadmap = async (uid: string) => {
    const { data, error } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", uid)
      .order("order_index", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setRoadmapData(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      await fetchRoadmap(user.id);
    };

    init();
  }, []);

  /* ---------------- GENERATE ROADMAP FROM JSON ---------------- */

  const generateRoadmapFromJSON = async () => {
    if (!userId || !selectedPath) return;

    const selected = learningPaths.find(
      (item: any) => item.topic === selectedPath
    );

    if (!selected) {
      console.error("Topic not found");
      return;
    }

    // Confirm overwrite
    const confirm = window.confirm(
      "This will replace your existing roadmap. Continue?"
    );
    if (!confirm) return;

    // Delete existing roadmap
    await supabase
      .from("roadmaps")
      .delete()
      .eq("user_id", userId);

    // Format steps
    const formatted = selected.roadmap.map(
      (step: any, index: number) => ({
        user_id: userId,
        topic: selectedPath,
        order_index: index,
        title: step.title,
        description: step.description,
        type: "learning",
        resources: step.resources,
        is_completed: false,
        is_unlocked: index === 0,
        difficulty: 0,
        score: null,
      })
    );

    const { error } = await supabase
      .from("roadmaps")
      .insert(formatted);

    if (error) {
      console.error(error);
      return;
    }

    await fetchRoadmap(userId);
  };

  /* ---------------- COMPLETE MODULE ---------------- */

  const completeModule = async (module: any, index: number) => {
    if (!userId) return;
    if (!module.is_unlocked || module.is_completed) return;

    // Mark complete
    await supabase
      .from("roadmaps")
      .update({ is_completed: true })
      .eq("id", module.id);

    // Unlock next
    const next = roadmapData[index + 1];
    if (next) {
      await supabase
        .from("roadmaps")
        .update({ is_unlocked: true })
        .eq("id", next.id);
    }

    // Log activity for metrics
    await supabase.from("activity_logs").insert([
      {
        user_id: userId,
        action: "MODULE_COMPLETED",
        metadata: { roadmap_id: module.id, title: module.title },
      },
    ]);

    await recalculateMetrics(userId);

    // Update credibility from roadmap completions (e.g. up to 10 pts per module, cap 100)
    const { data: updatedRoadmap } = await supabase
      .from("roadmaps")
      .select("id")
      .eq("user_id", userId)
      .eq("is_completed", true);
    const completedCount = updatedRoadmap?.length ?? 0;
    const newCredibility = Math.min(100, completedCount * 10);
    await updateCredibility(userId, newCredibility);

    window.dispatchEvent(new Event("credibilityUpdated"));
    window.dispatchEvent(new Event("roadmapProgressUpdated"));

    await fetchRoadmap(userId);
  };

  /* ---------------- PROGRESS ---------------- */

  const total = roadmapData.length;
  const completed = roadmapData.filter((m) => m.is_completed).length;
  const progress =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return <HelpCircle className="w-4 h-4" />;
      case "project":
        return <FileCode className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const toggleResources = (index: number) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const renderResourceLinks = (resources: any) => {
    if (!resources || typeof resources !== "object") return null;
    const sections: { key: string; label: string; icon: React.ReactNode; items: { title: string; url?: string }[] }[] = [];
    if (Array.isArray(resources.articles) && resources.articles.length) {
      sections.push({
        key: "articles",
        label: "Articles",
        icon: <BookOpen className="w-4 h-4" />,
        items: resources.articles.map((a: any) => (typeof a === "string" ? { title: a } : { title: a.title, url: a.url })),
      });
    }
    if (Array.isArray(resources.courses) && resources.courses.length) {
      sections.push({
        key: "courses",
        label: "Courses",
        icon: <GraduationCap className="w-4 h-4" />,
        items: resources.courses.map((c: any) => (typeof c === "string" ? { title: c } : { title: c.title, url: c.url })),
      });
    }
    if (Array.isArray(resources.videos) && resources.videos.length) {
      sections.push({
        key: "videos",
        label: "Videos",
        icon: <Video className="w-4 h-4" />,
        items: resources.videos.map((v: any) => (typeof v === "string" ? { title: v } : { title: v.title, url: v.url })),
      });
    }
    if (Array.isArray(resources.projects) && resources.projects.length) {
      sections.push({
        key: "projects",
        label: "Projects",
        icon: <FolderOpen className="w-4 h-4" />,
        items: resources.projects.map((p: any) => (typeof p === "string" ? { title: p } : { title: p.title, url: p.url })),
      });
    }
    if (sections.length === 0) return null;
    return (
      <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
        {sections.map(({ key, label, icon, items }) => (
          <div key={key}>
            <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
              {icon}
              {label}
            </p>
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li key={i}>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">{item.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-5xl mx-auto pb-20">

      {/* PATH SELECTOR */}
      <div className="mb-10 flex items-center gap-4">
        <select
          value={selectedPath}
          onChange={(e) => setSelectedPath(e.target.value)}
          className="bg-zinc-800 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer min-w-[200px] [&_option]:bg-zinc-800 [&_option]:text-white"
          style={{ colorScheme: "dark" }}
        >
          <option value="">Choose Path</option>
          {learningPaths.map((path: any) => (
            <option key={path.topic} value={path.topic}>
              {path.topic}
            </option>
          ))}
        </select>

        <button
          onClick={generateRoadmapFromJSON}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white"
        >
          Generate Roadmap
        </button>
      </div>

      {/* Progress */}
      <div className="mb-10">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>

        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
          />
        </div>
      </div>

      {/* ROADMAP TIMELINE */}
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-purple-500/20" />

        <div className="space-y-10">
          {roadmapData.map((module, index) => {
            const locked =
              index !== 0 && !roadmapData[index - 1].is_completed;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                {/* Node */}
                <div
                  className={`absolute left-[-22px] top-6 w-4 h-4 rounded-full border-2 ${
                    locked
                      ? "bg-zinc-800 border-zinc-700"
                      : module.is_completed
                      ? "bg-green-500 border-white"
                      : "bg-purple-500 border-white"
                  }`}
                />

                <div
                  className={`p-6 rounded-2xl glass border ${
                    locked
                      ? "opacity-40 pointer-events-none"
                      : "border-white/10 hover:border-purple-500/30 cursor-pointer"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {locked ? (
                        <Lock className="w-5 h-5 text-gray-500 shrink-0" />
                      ) : (
                        getIcon(module.type)
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-bold">
                          {module.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {module.description}
                        </p>
                        {module.resources && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleResources(index);
                              }}
                              className="mt-2 flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300"
                            >
                              {expandedResources.has(index) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              Resources
                            </button>
                            {expandedResources.has(index) && renderResourceLinks(module.resources)}
                          </>
                        )}
                      </div>
                    </div>

                    {!locked && !module.is_completed && (
                      <button
                        onClick={() =>
                          completeModule(module, index)
                        }
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-sm shrink-0"
                      >
                        Complete
                      </button>
                    )}

                    {module.is_completed && (
                      <Check className="text-green-400 shrink-0" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
