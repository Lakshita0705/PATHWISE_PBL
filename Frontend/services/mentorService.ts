import { supabase } from "../lib/supabaseClient";

/* Fetch all mentors (public read) */
export const getMentors = async () => {
  return await supabase
    .from("mentors")
    .select("*")
    .order("rating", { ascending: false });
};

/* Book a mentor session */
export const bookMentorSession = async (
  userId: string,
  mentorId: string,
  sessionDate: string
) => {
  return await supabase.from("mentor_sessions").insert([
    {
      user_id: userId,
      mentor_id: mentorId,
      session_date: sessionDate,
      status: "scheduled",
    },
  ]);
};

/* Get user's booked sessions */
export const getUserSessions = async (userId: string) => {
  return await supabase
    .from("mentor_sessions")
    .select("*")
    .eq("user_id", userId);
};
