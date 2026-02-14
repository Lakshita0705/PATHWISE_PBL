import { supabase } from "../lib/supabaseClient";

export const createRoadmap = async (data: any) => {
  return await supabase.from("roadmaps").insert([data]);
};

export const getUserRoadmap = async (userId: string) => {
  return await supabase
    .from("roadmaps")
    .select("*")
    .eq("user_id", userId);
};
