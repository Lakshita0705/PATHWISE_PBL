import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const Mentorship: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const fetchMentors = async () => {
    setError("");
    setLoading(true);

    // Primary source: mentors table
    const { data: mentorData, error: mentorErr } = await supabase
      .from("mentors")
      .select("*")
      .order("rating", { ascending: false });

    if (!mentorErr && mentorData && mentorData.length > 0) {
      const withUnread = mentorData.map((m: any) => ({ ...m, unreadCount: 0 }));
      setMentors(withUnread);
      setLoading(false);
      return;
    }

    // Fallback source: profiles with mentor role
    const { data: profileMentors, error: profileErr } = await supabase
      .from("profiles")
      .select("id,name,skills")
      .eq("role", "mentor")
      .limit(100);

    if (profileErr) {
      setError(profileErr.message || mentorErr?.message || "Could not load mentors.");
      setMentors([]);
      setLoading(false);
      return;
    }

    const normalized = (profileMentors || []).map((p: any) => ({
      id: p.id,
      name: p.name || "Mentor",
      role: "Mentor",
      company: "Pathwise Mentor",
      rating: 5.0,
      expertise: Array.isArray(p.skills) ? p.skills : [],
      image_url: "https://placehold.co/200x200/png",
    }));

    if (mentorErr) {
      // Show helpful message but still render fallback mentor list.
      setError(`Mentors table unavailable (${mentorErr.message}). Showing approved mentor profiles.`);
    }
    setMentors(normalized.map((m) => ({ ...m, unreadCount: 0 })));
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      await fetchMentors();

      const { data: unreadRows } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", user.id)
        .eq("is_read", false)
        .limit(1000);
      const unreadByMentor: Record<string, number> = {};
      for (const row of unreadRows || []) {
        unreadByMentor[row.sender_id] = (unreadByMentor[row.sender_id] || 0) + 1;
      }
      setMentors((prev) =>
        prev.map((mentor) => ({
          ...mentor,
          unreadCount: unreadByMentor[mentor.id] || 0,
        }))
      );
    };

    fetchData();
  }, []);

  // 🔥 Book Mentor Session (No Credibility Restriction)
  const bookSession = async (mentorId: string) => {
    if (!userId) return;

    // 1️⃣ Insert session
    const { error } = await supabase.from("mentor_sessions").insert([
      {
        user_id: userId,
        mentor_id: mentorId,
        session_date: new Date(),
        status: "scheduled",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Booking failed");
      return;
    }

    // 2️⃣ Insert activity log
    await supabase.from("activity_logs").insert([
      {
        user_id: userId,
        action: "MENTOR_BOOKED",
        metadata: { mentor_id: mentorId },
      },
    ]);

    alert("Session booked successfully!");
  };

  return (
    <div className="pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">
          Elite Mentorship
        </h1>
        <p className="text-gray-400">
          Direct access to top industry mentors.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-200 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-gray-300">
          Loading mentors...
        </div>
      )}

      {!loading && mentors.length === 0 && (
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-gray-300 flex items-center justify-between gap-4">
          <span>No mentors found yet. Once approved mentors are added, they will appear here.</span>
          <button
            type="button"
            onClick={fetchMentors}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold"
          >
            Refresh
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {mentors.map((mentor) => (
          <motion.div
            key={mentor.id}
            whileHover={{ y: -8 }}
            className="glass rounded-3xl p-6 border border-white/10 hover:border-purple-500/30 relative flex flex-col"
          >
            <div className="mb-6">
              <img
                src={mentor.image_url || "https://placehold.co/200x200/png"}
                alt={mentor.name}
                className="w-20 h-20 rounded-2xl object-cover mb-4"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://placehold.co/200x200/png";
                }}
              />

              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-white">
                  {mentor.rating}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white">
                {mentor.name}
              </h3>
              <p className="text-purple-400 text-sm">
                {mentor.role}
              </p>
              <p className="text-gray-500 text-xs">
                {mentor.company}
              </p>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={() => bookSession(mentor.id)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm"
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Book Session
              </button>

              <button
                onClick={() => navigate(`/chat/${mentor.id}`)}
                className="w-full py-3 rounded-xl glass border border-white/5 text-gray-300 font-bold text-sm"
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Message {mentor.unreadCount > 0 ? `(${mentor.unreadCount})` : ""}
              </button>
            </div>

            {/* Verified Badge */}
            <div className="absolute top-4 right-4 text-green-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Mentorship;
