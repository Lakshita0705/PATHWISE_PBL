import { supabase } from "../lib/supabaseClient";

export const generateRoadmap = async (
  userId: string,
  careerGoal: string
) => {
  const templates: any = {
    "Software Engineer": [
      { week: 1, title: "DSA Fundamentals" },
      { week: 2, title: "Backend Basics" },
      { week: 3, title: "System Design" },
    ],
    "Data Scientist": [
      { week: 1, title: "Python + Numpy" },
      { week: 2, title: "Statistics" },
      { week: 3, title: "ML Models" },
    ],
  };

  const selected = templates[careerGoal] || templates["Software Engineer"];

  const inserts = selected.map((item) => ({
    user_id: userId,
    week_number: item.week,
    title: item.title,
    description: "",
    is_completed: false,
  }));

  await supabase.from("roadmaps").insert(inserts);
};
