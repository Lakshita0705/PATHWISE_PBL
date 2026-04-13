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
type FinalQuizQuestion = { question: string; options: string[]; correct: string };

const FINAL_QUIZ_BANK: Record<string, FinalQuizQuestion[]> = {
  "Frontend Development": [
    { question: "What does CSS Flexbox help with?", options: ["API calls", "Security", "Layout", "Database"], correct: "Layout" },
    { question: "DOM stands for?", options: ["Design Object Model", "Data Object Model", "Document Object Model", "None"], correct: "Document Object Model" },
    { question: "Which is a frontend framework?", options: ["MongoDB", "SQL", "React", "Node.js"], correct: "React" },
    { question: "Media queries are used for?", options: ["Responsive design", "API", "Database", "Git"], correct: "Responsive design" },
    { question: "Event bubbling flows?", options: ["Parent→Child", "Stop", "Reload", "Child→Parent"], correct: "Child→Parent" },
  ],
  "Backend Development": [
    { question: "API is?", options: ["UI", "Database", "Communication between systems", "Styling"], correct: "Communication between systems" },
    { question: "GET request is used to?", options: ["Delete", "Fetch data", "Update", "Send"], correct: "Fetch data" },
    { question: "Middleware works?", options: ["UI", "API", "Database", "Between request & response"], correct: "Between request & response" },
    { question: "Server does?", options: ["Process requests", "Styling", "UI", "Git"], correct: "Process requests" },
    { question: "Authentication means?", options: ["Store data", "API", "Verify user", "CSS"], correct: "Verify user" },
  ],
  "Full Stack Development": [
    { question: "Full stack means?", options: ["Both frontend & backend", "Only frontend", "Only backend", "Database"], correct: "Both frontend & backend" },
    { question: "Which is full stack combo?", options: ["SQL", "Git", "React + Node", "HTML"], correct: "React + Node" },
    { question: "REST API is?", options: ["Database", "API architecture", "UI", "CSS"], correct: "API architecture" },
    { question: "MongoDB is?", options: ["Frontend tool", "API", "Database", "CSS"], correct: "Database" },
    { question: "Express is used for?", options: ["UI", "Backend", "CSS", "Database"], correct: "Backend" },
  ],
  DevOps: [
    { question: "CI/CD means?", options: ["Continuous Integration & Delivery", "Database", "API", "UI"], correct: "Continuous Integration & Delivery" },
    { question: "Docker is used for?", options: ["Styling", "Database", "Containerization", "API"], correct: "Containerization" },
    { question: "DevOps focuses on?", options: ["UI", "Testing only", "Development + Operations", "CSS"], correct: "Development + Operations" },
    { question: "Kubernetes is?", options: ["API", "Database", "Container orchestration", "UI"], correct: "Container orchestration" },
    { question: "Deployment means?", options: ["Writing code", "Running app on server", "Debugging", "Styling"], correct: "Running app on server" },
  ],
  "AI Engineering": [
    { question: "AI refers to?", options: ["Smart machines", "Database", "CSS", "UI"], correct: "Smart machines" },
    { question: "ML is?", options: ["Database", "Subset of AI", "UI", "CSS"], correct: "Subset of AI" },
    { question: "NLP is used for?", options: ["Images", "Numbers", "Language processing", "API"], correct: "Language processing" },
    { question: "Model training uses?", options: ["CSS", "Data", "UI", "Git"], correct: "Data" },
    { question: "Overfitting means?", options: ["Good generalization", "UI", "Memorization", "API"], correct: "Memorization" },
  ],
  "Data Analysis": [
    { question: "Data analysis means?", options: ["Styling", "Extract insights", "API", "CSS"], correct: "Extract insights" },
    { question: "Which tool is used?", options: ["HTML", "CSS", "Excel", "Git"], correct: "Excel" },
    { question: "Visualization means?", options: ["Code", "Graphs", "API", "DB"], correct: "Graphs" },
    { question: "Data cleaning means?", options: ["Styling", "Remove errors", "API", "UI"], correct: "Remove errors" },
    { question: "KPI means?", options: ["Code", "Key metric", "CSS", "DB"], correct: "Key metric" },
  ],
  "Data Scientist": [
    { question: "Data science focuses on?", options: ["UI", "Insights + models", "CSS", "API"], correct: "Insights + models" },
    { question: "Feature means?", options: ["Input variable", "Output", "UI", "CSS"], correct: "Input variable" },
    { question: "Prediction is?", options: ["Input", "Output", "CSS", "API"], correct: "Output" },
    { question: "Python is used for?", options: ["Styling", "Data tasks", "UI", "API"], correct: "Data tasks" },
    { question: "Model means?", options: ["Algorithm", "CSS", "UI", "DB"], correct: "Algorithm" },
  ],
  "Android Development": [
    { question: "Android apps use?", options: ["Java/Kotlin", "CSS", "HTML", "SQL"], correct: "Java/Kotlin" },
    { question: "APK file is?", options: ["Database", "App package", "UI", "API"], correct: "App package" },
    { question: "Android Studio is?", options: ["IDE", "DB", "CSS", "API"], correct: "IDE" },
    { question: "Activity represents?", options: ["Screen", "DB", "API", "CSS"], correct: "Screen" },
    { question: "Intent is used for?", options: ["Styling", "Navigation", "DB", "API"], correct: "Navigation" },
  ],
  "Android Developer": [
    { question: "Android apps use?", options: ["Java/Kotlin", "CSS", "HTML", "SQL"], correct: "Java/Kotlin" },
    { question: "APK file is?", options: ["Database", "App package", "UI", "API"], correct: "App package" },
    { question: "Android Studio is?", options: ["IDE", "DB", "CSS", "API"], correct: "IDE" },
    { question: "Activity represents?", options: ["Screen", "DB", "API", "CSS"], correct: "Screen" },
    { question: "Intent is used for?", options: ["Styling", "Navigation", "DB", "API"], correct: "Navigation" },
  ],
  "iOS Development": [
    { question: "iOS uses?", options: ["Swift", "CSS", "HTML", "SQL"], correct: "Swift" },
    { question: "Xcode is?", options: ["IDE", "DB", "CSS", "API"], correct: "IDE" },
    { question: "IPA file is?", options: ["App file", "DB", "UI", "CSS"], correct: "App file" },
    { question: "UIKit is?", options: ["UI framework", "DB", "API", "CSS"], correct: "UI framework" },
    { question: "Simulator is used for?", options: ["Testing apps", "DB", "CSS", "API"], correct: "Testing apps" },
  ],
  "Data Engineering": [
    { question: "ETL stands for?", options: ["Extract Transform Load", "UI", "CSS", "API"], correct: "Extract Transform Load" },
    { question: "Pipeline means?", options: ["UI", "Data flow", "CSS", "API"], correct: "Data flow" },
    { question: "Data warehouse is?", options: ["Storage system", "UI", "CSS", "API"], correct: "Storage system" },
    { question: "Batch processing means?", options: ["Real-time", "Bulk data", "UI", "CSS"], correct: "Bulk data" },
    { question: "SQL is used for?", options: ["Styling", "Query data", "UI", "API"], correct: "Query data" },
  ],
  "Machine Learning": [
    { question: "ML is?", options: ["Learning from data", "UI", "CSS", "API"], correct: "Learning from data" },
    { question: "Supervised learning uses?", options: ["Labeled data", "UI", "CSS", "API"], correct: "Labeled data" },
    { question: "Overfitting means?", options: ["Memorization", "UI", "CSS", "API"], correct: "Memorization" },
    { question: "Accuracy means?", options: ["Correctness", "UI", "CSS", "API"], correct: "Correctness" },
    { question: "Feature is?", options: ["Input", "Output", "CSS", "API"], correct: "Input" },
  ],
  "Software Architecture": [
    { question: "Software architecture defines?", options: ["UI design", "System structure", "Database only", "API calls"], correct: "System structure" },
    { question: "Microservices are?", options: ["Large systems", "Small independent services", "UI tools", "CSS"], correct: "Small independent services" },
    { question: "Monolithic architecture means?", options: ["Multiple services", "Single unified system", "API only", "DB only"], correct: "Single unified system" },
    { question: "Scalability means?", options: ["UI improvement", "Handling growth", "Styling", "Debugging"], correct: "Handling growth" },
    { question: "Load balancer does?", options: ["UI design", "Distributes traffic", "Stores data", "API calls"], correct: "Distributes traffic" },
  ],
  "QA Engineering": [
    { question: "QA focuses on?", options: ["UI design", "Testing software", "API", "CSS"], correct: "Testing software" },
    { question: "Unit testing tests?", options: ["Entire system", "Small components", "UI", "Database"], correct: "Small components" },
    { question: "Bug means?", options: ["Feature", "Error", "UI", "API"], correct: "Error" },
    { question: "Automation testing uses?", options: ["Manual work", "Scripts/tools", "UI", "CSS"], correct: "Scripts/tools" },
    { question: "Regression testing checks?", options: ["New bugs", "Old features still work", "UI", "API"], correct: "Old features still work" },
  ],
  "Blockchain Development": [
    { question: "Blockchain is?", options: ["Central system", "Distributed ledger", "UI", "API"], correct: "Distributed ledger" },
    { question: "Smart contracts are?", options: ["UI", "Self-executing code", "CSS", "DB"], correct: "Self-executing code" },
    { question: "Bitcoin uses?", options: ["SQL", "Blockchain", "CSS", "API"], correct: "Blockchain" },
    { question: "Decentralization means?", options: ["Single control", "No central authority", "UI", "CSS"], correct: "No central authority" },
    { question: "Ethereum is?", options: ["Database", "Blockchain platform", "UI", "CSS"], correct: "Blockchain platform" },
  ],
  Cybersecurity: [
    { question: "Cybersecurity protects?", options: ["UI", "Systems & data", "CSS", "API"], correct: "Systems & data" },
    { question: "Firewall does?", options: ["Styling", "Blocks threats", "UI", "DB"], correct: "Blocks threats" },
    { question: "Phishing is?", options: ["Attack", "UI", "CSS", "API"], correct: "Attack" },
    { question: "Encryption means?", options: ["Hide data", "Show data", "UI", "CSS"], correct: "Hide data" },
    { question: "Password hashing is?", options: ["Store plain", "Secure storage", "UI", "API"], correct: "Secure storage" },
  ],
  "Game Development": [
    { question: "Game engine is?", options: ["UI", "Framework for games", "DB", "API"], correct: "Framework for games" },
    { question: "Unity is?", options: ["DB", "Game engine", "CSS", "API"], correct: "Game engine" },
    { question: "FPS stands for?", options: ["Frames per second", "File system", "UI", "API"], correct: "Frames per second" },
    { question: "Physics engine handles?", options: ["UI", "Movement & collisions", "DB", "CSS"], correct: "Movement & collisions" },
    { question: "Rendering means?", options: ["Drawing graphics", "DB", "API", "CSS"], correct: "Drawing graphics" },
  ],
  "UI/UX Design": [
    { question: "UI means?", options: ["User Interface", "Data", "API", "CSS"], correct: "User Interface" },
    { question: "UX focuses on?", options: ["User experience", "DB", "API", "CSS"], correct: "User experience" },
    { question: "Wireframe is?", options: ["Final design", "Basic layout", "API", "DB"], correct: "Basic layout" },
    { question: "Usability means?", options: ["Easy to use", "Complex", "API", "CSS"], correct: "Easy to use" },
    { question: "Prototyping is?", options: ["Testing design", "DB", "API", "CSS"], correct: "Testing design" },
  ],
  MLOps: [
    { question: "MLOps combines?", options: ["ML + DevOps", "UI", "CSS", "API"], correct: "ML + DevOps" },
    { question: "Model deployment means?", options: ["Train", "Use in production", "UI", "CSS"], correct: "Use in production" },
    { question: "Monitoring checks?", options: ["UI", "Model performance", "CSS", "API"], correct: "Model performance" },
    { question: "Versioning tracks?", options: ["Code/models", "UI", "CSS", "API"], correct: "Code/models" },
    { question: "Pipeline automates?", options: ["UI", "ML workflow", "CSS", "API"], correct: "ML workflow" },
  ],
  "Product Management": [
    { question: "Product manager does?", options: ["Coding", "Manage product", "UI", "CSS"], correct: "Manage product" },
    { question: "Roadmap is?", options: ["Plan", "Code", "DB", "API"], correct: "Plan" },
    { question: "KPI means?", options: ["Key metric", "UI", "CSS", "API"], correct: "Key metric" },
    { question: "Stakeholders are?", options: ["Users/team", "UI", "CSS", "API"], correct: "Users/team" },
    { question: "MVP means?", options: ["Minimum product", "UI", "CSS", "API"], correct: "Minimum product" },
  ],
};

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
  const [isFinalQuizOpen, setIsFinalQuizOpen] = useState(false);
  const [finalQuizAnswers, setFinalQuizAnswers] = useState<Record<number, string>>({});
  const [finalQuizSubmitted, setFinalQuizSubmitted] = useState(false);
  const [finalQuizScore, setFinalQuizScore] = useState(0);
  const [finalQuizTopic, setFinalQuizTopic] = useState("");
  const [finalQuizQuestions, setFinalQuizQuestions] = useState<FinalQuizQuestion[]>([]);

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

  const getFinalQuizPassMap = (uid: string): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem(`roadmap_final_quiz_pass_${uid}`);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const setFinalQuizPassMap = (uid: string, value: Record<string, boolean>) => {
    localStorage.setItem(`roadmap_final_quiz_pass_${uid}`, JSON.stringify(value));
  };

  const getFinalQuizScoreMap = (uid: string): Record<string, number> => {
    try {
      const raw = localStorage.getItem(`roadmap_final_quiz_score_${uid}`);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const setFinalQuizScoreMap = (uid: string, value: Record<string, number>) => {
    localStorage.setItem(`roadmap_final_quiz_score_${uid}`, JSON.stringify(value));
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
    // Reset final-quiz status for this topic when regenerating roadmap.
    const currentPassMap = getFinalQuizPassMap(userId);
    const currentScoreMap = getFinalQuizScoreMap(userId);
    if (currentPassMap[generatedTopic] || currentScoreMap[generatedTopic] !== undefined) {
      const nextPassMap = { ...currentPassMap };
      const nextScoreMap = { ...currentScoreMap };
      delete nextPassMap[generatedTopic];
      delete nextScoreMap[generatedTopic];
      setFinalQuizPassMap(userId, nextPassMap);
      setFinalQuizScoreMap(userId, nextScoreMap);
    }
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
    if (String(module.id).startsWith("local-")) {
      const localRows = getLocalRoadmaps(userId);
      const updated = localRows.map((row: any) =>
        row.id === module.id ? { ...row, is_completed: true } : row
      );
      setLocalRoadmaps(userId, updated);
      window.dispatchEvent(new Event("roadmapProgressUpdated"));
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

    await fetchRoadmap(userId);
  };

  /* ---------------- PROGRESS ---------------- */

  const roadmapGroups = roadmapData.reduce((acc: Record<string, any[]>, item: any) => {
    const topic = item.topic || "Untitled";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(item);
    return acc;
  }, {});
  const finalPassMap = userId ? getFinalQuizPassMap(userId) : {};
  const finalScoreMap = userId ? getFinalQuizScoreMap(userId) : {};

  const inProgressTopics = Object.entries(roadmapGroups)
    .filter(([topic, modules]) => {
      const moduleList = modules as any[];
      const allStagesDone =
        moduleList.length > 0 && moduleList.every((m) => m.is_completed);
      // Keep topic visible until final quiz is passed.
      if (allStagesDone) {
        return !Boolean(finalPassMap[topic]);
      }
      return moduleList.some((m) => !m.is_completed);
    })
    .map(([topic]) => topic);

  const completedTopics = Object.entries(roadmapGroups)
    .filter(
      ([topic, modules]) =>
        (modules as any[]).length > 0 &&
        (modules as any[]).every((m) => m.is_completed) &&
        Boolean(finalPassMap[topic])
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
  const allStagesCompleted = total > 0 && completed === total;
  const computedFinalQuiz: FinalQuizQuestion[] =
    FINAL_QUIZ_BANK[activeRoadmapTopic] || [
      { question: "What is the best way to complete this roadmap?", options: ["Skip stages", "Practice and complete stages", "Delete modules", "Ignore resources"], correct: "Practice and complete stages" },
      { question: "Roadmap progress is built by?", options: ["Completing each stage", "Random guessing", "Skipping tasks", "Only reading titles"], correct: "Completing each stage" },
      { question: "Resources in roadmap help with?", options: ["Learning and practice", "UI color change", "Database reset", "None"], correct: "Learning and practice" },
      { question: "Final quiz helps to?", options: ["Validate understanding", "Style app", "Change role", "Delete history"], correct: "Validate understanding" },
      { question: "To pass roadmap, student should?", options: ["Pass final quiz", "Close app", "Skip modules", "Do nothing"], correct: "Pass final quiz" },
    ];
  const activeFinalQuiz =
    isFinalQuizOpen && finalQuizQuestions.length === 5 ? finalQuizQuestions : computedFinalQuiz;
  const allFinalAnswered = activeFinalQuiz.every((_, idx) => Boolean(finalQuizAnswers[idx]));

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
      {allStagesCompleted && finalPassMap[activeRoadmapTopic] && (
        <div className="mb-8 p-4 rounded-xl border border-green-400/20 bg-green-500/10 text-green-100 text-sm">
          Final Quiz Passed: {finalScoreMap[activeRoadmapTopic] || 0}/5 - Roadmap Completed 🎉
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
                        type="button"
                        onClick={() => completeModule(module, index)}
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
      {visibleRoadmap.length > 0 && (
        <div className="mt-10 p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Final Quiz</h3>
            <p className="text-sm text-gray-400">
              5 domain-specific questions. Complete all roadmap stages first.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const snapshotTopic = activeRoadmapTopic;
              const snapshotQuiz =
                FINAL_QUIZ_BANK[snapshotTopic] || computedFinalQuiz;
              setFinalQuizTopic(snapshotTopic);
              setFinalQuizQuestions(snapshotQuiz);
              setIsFinalQuizOpen(true);
              setFinalQuizSubmitted(false);
              setFinalQuizAnswers({});
              setFinalQuizScore(0);
            }}
            disabled={!allStagesCompleted}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Take Quiz
          </button>
        </div>
      )}
      {isFinalQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Final Quiz - {finalQuizTopic || activeRoadmapTopic}</h3>
              <button
                type="button"
                  onClick={() => {
                    setIsFinalQuizOpen(false);
                    setFinalQuizQuestions([]);
                  }}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              {activeFinalQuiz.map((q, index) => {
                const selected = finalQuizAnswers[index];
                const isCorrect = selected === q.correct;
                const isWrong = finalQuizSubmitted && selected && !isCorrect;
                return (
                  <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <p className="text-xs text-gray-400 mb-1">Question {index + 1}/5</p>
                    <p className="text-sm text-white mb-3">{q.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt) => {
                        const selectedOpt = selected === opt;
                        const showCorrect = finalQuizSubmitted && opt === q.correct;
                        const showWrong = finalQuizSubmitted && selectedOpt && opt !== q.correct;
                        return (
                          <label
                            key={opt}
                            className={`p-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                              showCorrect
                                ? "border-green-500 bg-green-500/15 text-green-200"
                                : showWrong
                                ? "border-red-500 bg-red-500/15 text-red-200"
                                : selectedOpt
                                ? "border-purple-500 bg-purple-500/15 text-white"
                                : "border-white/10 text-gray-300 hover:bg-white/5"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`final-quiz-${index}`}
                              value={opt}
                              checked={selected === opt}
                              onChange={(e) =>
                                setFinalQuizAnswers((prev) => ({ ...prev, [index]: e.target.value }))
                              }
                              className="mr-2"
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                    {finalQuizSubmitted && (
                      <p className={`text-xs mt-2 ${isCorrect ? "text-green-300" : "text-red-300"}`}>
                        {isCorrect ? "Correct" : `Incorrect. Correct answer: ${q.correct}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-300">
                {finalQuizSubmitted ? `Score: ${finalQuizScore}/5` : "Answer all 5 questions to submit."}
              </div>
              <div className="flex gap-2">
                {finalQuizSubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      setFinalQuizAnswers({});
                      setFinalQuizSubmitted(false);
                      setFinalQuizScore(0);
                    }}
                    className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  disabled={!allFinalAnswered || finalQuizSubmitted}
                  onClick={() => {
                    const score = activeFinalQuiz.reduce(
                      (acc, q, idx) => (finalQuizAnswers[idx] === q.correct ? acc + 1 : acc),
                      0
                    );
                    setFinalQuizScore(score);
                    setFinalQuizSubmitted(true);
                    if (!userId) return;
                      const topicKey = finalQuizTopic || activeRoadmapTopic;
                      const nextScoreMap = { ...getFinalQuizScoreMap(userId), [topicKey]: score };
                    setFinalQuizScoreMap(userId, nextScoreMap);
                    if (score >= 4) {
                        const nextPassMap = { ...getFinalQuizPassMap(userId), [topicKey]: true };
                      setFinalQuizPassMap(userId, nextPassMap);
                        setCongratsTopic(topicKey);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
            {finalQuizSubmitted && (
              <p className={`mt-3 text-sm ${finalQuizScore >= 4 ? "text-green-300" : "text-yellow-300"}`}>
                {finalQuizScore >= 4 ? "Roadmap Completed 🎉" : "Try Again"}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
