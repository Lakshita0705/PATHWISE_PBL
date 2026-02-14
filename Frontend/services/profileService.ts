import { supabase } from "../lib/supabaseClient";

export const createProfile = async (profileData: any) => {
  return await supabase.from("profiles").insert([profileData]);
};

export const getProfile = async (userId: string) => {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
};

export const updateCredibility = async (userId: string, score: number) => {
  return await supabase
    .from("profiles")
    .update({ credibility_score: score })
    .eq("id", userId);
};
