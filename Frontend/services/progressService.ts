import { supabase } from "../lib/supabaseClient";

export const addProgress = async (data: any) => {
  return await supabase.from("progress").insert([data]);
};

export const getProgress = async (userId: string) => {
  return await supabase
    .from("progress")
    .select("*")
    .eq("user_id", userId);
};
