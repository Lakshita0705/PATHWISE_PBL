import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Send, Video, Star } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

type DbMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  is_read?: boolean;
};

const Chat: React.FC = () => {
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const [myId, setMyId] = useState<string | null>(null);
  const [otherName, setOtherName] = useState<string>("Chat");
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>("");
  const [canGoLive, setCanGoLive] = useState<boolean>(false);
  const [myRole, setMyRole] = useState<"student" | "mentor" | null>(null);
  const [otherRole, setOtherRole] = useState<"student" | "mentor" | null>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [ratingFeedback, setRatingFeedback] = useState<string>("");
  const [savingRating, setSavingRating] = useState<boolean>(false);
  const [toast, setToast] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: "",
  });
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const meetUrl = useMemo(() => "https://meet.google.com/new", []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const init = async () => {
      setError("");
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      setMyId(user.id);

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setCanGoLive(myProfile?.role === "mentor");
      setMyRole(myProfile?.role === "mentor" ? "mentor" : "student");

      if (!otherUserId) return;
      const { data: otherProfile } = await supabase
        .from("profiles")
        .select("name,role")
        .eq("id", otherUserId)
        .single();
      if (otherProfile?.name) setOtherName(otherProfile.name);
      setOtherRole(otherProfile?.role === "mentor" ? "mentor" : "student");

      if (myProfile?.role === "student" && otherProfile?.role === "mentor") {
        const { data: ratingRow } = await supabase
          .from("mentor_ratings")
          .select("rating,feedback")
          .eq("mentor_id", otherUserId)
          .eq("student_id", user.id)
          .maybeSingle();
        setMyRating(ratingRow?.rating || 0);
        setRatingFeedback(ratingRow?.feedback || "");
      }
    };
    init();
  }, [otherUserId]);

  const fetchMessages = async (me: string, other: string) => {
    const { data, error: msgErr } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`
      )
      .order("created_at", { ascending: true });

    if (msgErr) {
      setError(
        msgErr.message ||
          "Could not load messages. Ensure the `messages` table exists in Supabase."
      );
      return;
    }

    setMessages((data as DbMessage[]) || []);
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", me)
      .eq("sender_id", other)
      .eq("is_read", false);
  };

  useEffect(() => {
    if (!myId || !otherUserId) return;

    fetchMessages(myId, otherUserId);

    const channel = supabase
      .channel(`messages:${myId}:${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as DbMessage;
          const isForThisChat =
            (row.sender_id === myId && row.receiver_id === otherUserId) ||
            (row.sender_id === otherUserId && row.receiver_id === myId);
          if (!isForThisChat) return;
          setMessages((prev) => [...prev, row]);
          if (row.receiver_id === myId && row.sender_id === otherUserId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", row.id);
          }
          if (row.sender_id === otherUserId) {
            setToast({
              visible: true,
              text: `New message from ${otherName}: ${row.text?.slice(0, 60) || ""}`,
            });
            setTimeout(() => setToast({ visible: false, text: "" }), 2500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, otherUserId]);

  const send = async () => {
    setError("");
    if (!myId || !otherUserId) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");
    const { error: sendErr } = await supabase.from("messages").insert([
      {
        sender_id: myId,
        receiver_id: otherUserId,
        text: trimmed,
      },
    ]);

    if (sendErr) {
      setError(sendErr.message);
    }
  };

  const submitRating = async (value?: number) => {
    if (!myId || !otherUserId) return;
    const finalRating = value ?? myRating;
    if (!finalRating) return;
    setSavingRating(true);
    const { error: ratingErr } = await supabase.from("mentor_ratings").upsert(
      [
        {
          mentor_id: otherUserId,
          student_id: myId,
          rating: finalRating,
          feedback: ratingFeedback.trim() || null,
        },
      ],
      { onConflict: "mentor_id,student_id" }
    );
    setSavingRating(false);
    if (ratingErr) {
      setError(ratingErr.message);
      return;
    }
    setMyRating(finalRating);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] md:min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl glass rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-[75vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">{otherName}</h1>
            <p className="text-xs text-gray-500">1:1 chat</p>
          </div>
          {canGoLive && (
            <button
              onClick={() => window.open(meetUrl, "_blank", "noopener,noreferrer")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-sm flex items-center gap-2 hover:opacity-90 transition-all"
              type="button"
            >
              <Video className="w-4 h-4" />
              Go Live
            </button>
          )}
        </div>
        {toast.visible && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-200 text-sm">
            {toast.text}
          </div>
        )}

        {myRole === "student" && otherRole === "mentor" && (
          <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Rate mentor:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => submitRating(n)}
                  className="p-0.5"
                  title={`${n} star`}
                >
                  <Star className={`w-4 h-4 ${n <= myRating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`} />
                </button>
              ))}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Optional feedback"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => submitRating()}
                disabled={savingRating || myRating === 0}
                className="px-3 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-bold disabled:opacity-60"
              >
                {savingRating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === myId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                    mine
                      ? "bg-purple-600 text-white rounded-tr-none"
                      : "bg-white/5 text-gray-200 border border-white/10 rounded-tl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[10px] opacity-60 mt-1">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="p-6 border-t border-white/5 flex gap-3"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 transition-colors text-white font-black flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </form>
        {myRole === "student" && (
          <div className="px-6 pb-5">
            <button
              type="button"
              onClick={() => navigate("/mentorship")}
              className="px-4 py-2 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 text-sm"
            >
              Exit Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

