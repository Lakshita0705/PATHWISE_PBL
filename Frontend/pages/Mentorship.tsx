import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const Mentorship: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch mentors
      const { data: mentorData, error } = await supabase
        .from("mentors")
        .select("*")
        .order("rating", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setMentors(mentorData || []);
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {mentors.map((mentor) => (
          <motion.div
            key={mentor.id}
            whileHover={{ y: -8 }}
            className="glass rounded-3xl p-6 border border-white/10 hover:border-purple-500/30 relative flex flex-col"
          >
            <div className="mb-6">
              <img
                src={mentor.image_url}
                alt={mentor.name}
                className="w-20 h-20 rounded-2xl object-cover mb-4"
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
                className="w-full py-3 rounded-xl glass border border-white/5 text-gray-300 font-bold text-sm"
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Message
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
