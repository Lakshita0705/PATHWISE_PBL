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

const SKIP_BEGINNER = ["Advanced", "Production", "Scaling", "Enterprise", "Capstone"];
const SKIP_ADVANCED = ["Basics", "Fundamentals", "Introduction", "Getting Started"];

const adaptSteps = (steps: any[], level: "beginner" | "intermediate" | "advanced") => {
  let filtered = steps;
  if (level === "intermediate") {
    filtered = steps.filter(
      (s) => !SKIP_ADVANCED.some((k) => String(s.title || "").includes(k))
    );
    if (filtered.length === 0) filtered = steps;
  } else if (level === "advanced") {
    filtered = steps.filter(
      (s) =>
        !SKIP_BEGINNER.some((k) => String(s.title || "").includes(k)) &&
        !SKIP_ADVANCED.some((k) => String(s.title || "").includes(k))
    );
    if (filtered.length < 2) filtered = steps.slice(-3);
  }
  return filtered.map((s, i) => ({ ...s, step: i + 1 }));
};

const Roadmap: React.FC = () => {
  const [roadmapData, setRoadmapData] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [activeRoadmapTopic, setActiveRoadmapTopic] = useState<string>("");
  const [expandedResources, setExpandedResources] = useState<Set<number>>(new Set());
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [generatorError, setGeneratorError] = useState<string>("");
  const [usingLocalMode, setUsingLocalMode] = useState<boolean>(false);
  const [congratsTopic, setCongratsTopic] = useState<string>("");

  const getLocalRoadmaps = (uid: string) => {
    try {
      const raw = localStorage.getItem(`roadmaps_${uid}`);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const setLocalRoadmaps = (uid: string, data: any[]) => {
    localStorage.setItem(`roadmaps_${uid}`, JSON.stringify(data));
  };

  /* ---------------- FETCH USER + ROADMAP ---------------- */

  const fetchRoadmap = async (uid: string) => {
    const { data, error } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", uid)
      .order("topic", { ascending: true })
      .order("order_index", { ascending: true });

    if (error) {
      console.error(error);
      const localData = getLocalRoadmaps(uid);
      setRoadmapData(localData);
      if (localData.length > 0 && !activeRoadmapTopic) {
        setActiveRoadmapTopic(localData[0].topic);
      }
      return;
    }

    const localData = getLocalRoadmaps(uid);
    const nextData = [...(data || []), ...localData];
    setRoadmapData(nextData);

    if (!activeRoadmapTopic && nextData.length > 0) {
      setActiveRoadmapTopic(nextData[0].topic);
    } else if (
      activeRoadmapTopic &&
      !nextData.some((item) => item.topic === activeRoadmapTopic)
    ) {
      setActiveRoadmapTopic(nextData[0]?.topic || "");
    }
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

    const generatedTopic = selectedPath;
    const confirm = window.confirm(
      `This will replace your existing "${generatedTopic}" roadmap (if any). Continue?`
    );
    if (!confirm) return;

    await supabase
      .from("roadmaps")
      .delete()
      .eq("user_id", userId)
      .eq("topic", generatedTopic);

    const adaptedSteps = adaptSteps(selected.roadmap, level);
    const formatted = adaptedSteps.map(
      (step: any, index: number) => ({
        user_id: userId,
        topic: generatedTopic,
        order_index: index,
        title: step.title,
        description: step.description,
        is_completed: false,
      })
    );

    const { error } = await supabase
      .from("roadmaps")
      .insert(formatted);

    if (error) {
      console.error(error);
      if ((error.message || "").toLowerCase().includes("row-level security")) {
        const localRows = formatted.map((row: any, index: number) => ({
          ...row,
          id: `local-${Date.now()}-${index}`,
        }));
        const currentLocal = getLocalRoadmaps(userId).filter(
          (item: any) => item.topic !== generatedTopic
        );
        const nextLocal = [...currentLocal, ...localRows];
        setLocalRoadmaps(userId, nextLocal);
        setUsingLocalMode(true);
        setGeneratorError(
          "Saved locally (database policy blocked insert). You can still complete steps."
        );
        setActiveRoadmapTopic(generatedTopic);
        await fetchRoadmap(userId);
        return;
      }
      setGeneratorError(error.message || "Failed to save generated roadmap. Please try again.");
      return;
    }
    setUsingLocalMode(false);
    setGeneratorError("");

    setActiveRoadmapTopic(generatedTopic);
    await fetchRoadmap(userId);
  };

  /* ---------------- COMPLETE MODULE ---------------- */

  const completeModule = async (module: any, index: number) => {
    if (!userId) return;
    const locked = index !== 0 && !visibleRoadmap[index - 1]?.is_completed;
    if (locked || module.is_completed) return;
    const willCompleteRoadmap =
      visibleRoadmap.filter((m) => m.is_completed).length + 1 === visibleRoadmap.length;

    if (String(module.id).startsWith("local-")) {
      const localRows = getLocalRoadmaps(userId);
      const updated = localRows.map((row: any) =>
        row.id === module.id ? { ...row, is_completed: true } : row
      );
      setLocalRoadmaps(userId, updated);
      window.dispatchEvent(new Event("roadmapProgressUpdated"));
      if (willCompleteRoadmap) setCongratsTopic(activeRoadmapTopic);
      await fetchRoadmap(userId);
      return;
    }

    // Mark complete
    await supabase
      .from("roadmaps")
      .update({ is_completed: true })
      .eq("id", module.id);

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
    if (willCompleteRoadmap) setCongratsTopic(activeRoadmapTopic);

    await fetchRoadmap(userId);
  };

  /* ---------------- PROGRESS ---------------- */

  const roadmapGroups = roadmapData.reduce((acc: Record<string, any[]>, item: any) => {
    const topic = item.topic || "Untitled";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(item);
    return acc;
  }, {});

  const inProgressTopics = Object.entries(roadmapGroups)
    .filter(([, modules]) => (modules as any[]).some((m) => !m.is_completed))
    .map(([topic]) => topic);

  const completedTopics = Object.entries(roadmapGroups)
    .filter(
      ([, modules]) =>
        (modules as any[]).length > 0 && (modules as any[]).every((m) => m.is_completed)
    )
    .map(([topic]) => topic);

  const topics = inProgressTopics;

  const visibleRoadmap = topics.includes(activeRoadmapTopic)
    ? (roadmapGroups[activeRoadmapTopic] || []).sort(
        (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
      )
    : [];

  useEffect(() => {
    if (topics.length === 0) {
      if (activeRoadmapTopic) setActiveRoadmapTopic("");
      return;
    }
    if (!topics.includes(activeRoadmapTopic)) {
      setActiveRoadmapTopic(topics[0]);
    }
  }, [topics, activeRoadmapTopic]);

  const total = visibleRoadmap.length;
  const completed = visibleRoadmap.filter((m) => m.is_completed).length;
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

  const getResourcesForModule = (module: any) => {
    const sourcePath = (learningPaths as any[]).find((p: any) => p.topic === module.topic);
    if (!sourcePath || !Array.isArray(sourcePath.roadmap)) return null;
    const matchedByTitle = sourcePath.roadmap.find(
      (step: any) => String(step.title || "").trim() === String(module.title || "").trim()
    );
    if (matchedByTitle?.resources) return matchedByTitle.resources;
    const matchedByIndex = sourcePath.roadmap[module.order_index];
    return matchedByIndex?.resources || null;
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

      {/* ROADMAP GENERATOR */}
      <div className="mb-8 p-5 rounded-2xl border border-white/10 bg-white/5">
        <h2 className="text-xl font-semibold text-white mb-1">Career Roadmap Generator</h2>
        <p className="text-sm text-gray-400 mb-4">
          Choose a role, choose level, then generate a step-by-step roadmap students can complete.
        </p>
        <select
          value={selectedPath}
          onChange={(e) => setSelectedPath(e.target.value)}
          className="w-full mb-4 bg-zinc-800 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer [&_option]:bg-zinc-800 [&_option]:text-white"
          style={{ colorScheme: "dark" }}
        >
          <option value="">Choose Role / Roadmap</option>
          {learningPaths.map((path: any) => (
            <option key={path.topic} value={path.topic}>
              {path.topic}
            </option>
          ))}
        </select>
        <div className="flex gap-2 mb-4">
          {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevel(lvl)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                level === lvl
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </button>
          ))}
        </div>
        {generatorError && <p className="text-sm text-red-400 mb-3">{generatorError}</p>}
        {usingLocalMode && (
          <p className="text-xs text-yellow-300 mb-3">
            Local mode is active for roadmap save/complete in this browser.
          </p>
        )}
        <button
          type="button"
          onClick={generateRoadmapFromJSON}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white"
        >
          Generate Roadmap
        </button>
      </div>

      {/* Existing Roadmaps */}
      {topics.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">
            Your Roadmaps
          </p>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveRoadmapTopic(topic)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  activeRoadmapTopic === topic
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
      {congratsTopic && (
        <div className="mb-8 p-4 rounded-xl border border-green-400/20 bg-green-500/10 text-green-200">
          Congratulations! You completed the <span className="font-semibold">{congratsTopic}</span> roadmap.
        </div>
      )}

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
          {visibleRoadmap.map((module, index) => {
            const locked =
              index !== 0 && !visibleRoadmap[index - 1].is_completed;

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
                        {getResourcesForModule(module) && (
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
                            {expandedResources.has(index) &&
                              renderResourceLinks(getResourcesForModule(module))}
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
          {visibleRoadmap.length === 0 && (
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-gray-400">
              {topics.length === 0
                ? completedTopics.length > 0
                  ? "All your generated roadmaps are completed. Great job!"
                  : "Generate your first roadmap to get started."
                : "Select a roadmap topic to view modules."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
