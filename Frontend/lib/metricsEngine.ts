import { supabase } from "./supabaseClient";

export const recalculateMetrics = async (userId: string) => {
  // 1️⃣ Get activity logs
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId);

  if (!logs) return;

  // 🔹 Engagement = total logs this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyLogs = logs.filter(
    (log: any) => new Date(log.created_at) > oneWeekAgo
  );

  const engagementScore = weeklyLogs.length * 10;

  // 🔹 Velocity = module completions
  const completions = logs.filter(
    (log: any) => log.action === "MODULE_COMPLETED"
  ).length;

  const velocityScore = completions * 5;

  // 🔹 Mastery = simulated (you can connect quizzes later)
  const masteryScore = Math.min(100, completions * 8);

  // 2️⃣ Upsert metrics
  await supabase
    .from("user_metrics")
    .upsert({
      user_id: userId,
      engagement_score: engagementScore,
      velocity_score: velocityScore,
      mastery_score: masteryScore,
      updated_at: new Date(),
    });
};
