import learningPaths from "../data/learningPath.json";
import { supabase } from "./supabaseClient";


export const generateRoadmap = async (
  userId: string,
  topic: string,
  difficulty: number
) => {
  const level =
    difficulty === 0
      ? "beginner"
      : difficulty === 1
      ? "intermediate"
      : "advanced";

  const roadmap = learningPaths[topic]?.[level];

  if (!roadmap) return;

  const inserts = roadmap.map((item: any, index: number) => ({
    user_id: userId,
    topic,
    order_index: index,
    title: item.title,
    description: item.description,
    type: item.type,
    resources: item.resources,
    is_completed: false,
    is_unlocked: index === 0,
    difficulty,
  }));

  await supabase.from("roadmaps").insert(inserts);
};
