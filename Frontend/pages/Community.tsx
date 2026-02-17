import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Send,
  User,
  Clock,
  Edit,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface Question {
  id: string;
  user_id: string;
  question: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  answer: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

const Community: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionFormData, setQuestionFormData] = useState({
    question: "",
    description: "",
  });
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [editingAnswers, setEditingAnswers] = useState<Record<string, Answer | null>>({});
  const [loading, setLoading] = useState(true);
  const [showPostSuccess, setShowPostSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();
      if (profile) {
        setUserName(profile.name || profile.email || "User");
      }
      await fetchQuestions();
      setLoading(false);
    };
    init();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("community_questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const questionsWithUsers = await Promise.all(
      (data || []).map(async (q) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", q.user_id)
          .single();
        return {
          ...q,
          user_name: profile?.name || profile?.email?.split("@")[0] || "Anonymous",
          user_email: profile?.email,
        };
      })
    );

    setQuestions(questionsWithUsers);
    await fetchAnswersForQuestions(questionsWithUsers.map((q) => q.id));
  };

  const fetchAnswersForQuestions = async (questionIds: string[]) => {
    if (questionIds.length === 0) return;
    const { data, error } = await supabase
      .from("community_answers")
      .select("*")
      .in("question_id", questionIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const answersWithUsers = await Promise.all(
      (data || []).map(async (a) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", a.user_id)
          .single();
        return {
          ...a,
          user_name: profile?.name || profile?.email?.split("@")[0] || "Anonymous",
          user_email: profile?.email,
        };
      })
    );

    const grouped: Record<string, Answer[]> = {};
    answersWithUsers.forEach((a) => {
      if (!grouped[a.question_id]) grouped[a.question_id] = [];
      grouped[a.question_id].push(a);
    });
    setAnswers(grouped);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from("community_questions")
          .update({
            question: questionFormData.question,
            description: questionFormData.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("community_questions").insert([
          {
            user_id: userId,
            question: questionFormData.question,
            description: questionFormData.description || null,
          },
        ]);
        if (error) throw error;
      }
      await fetchQuestions();
      if (!editingQuestion) {
        // Show success message for new questions
        setShowPostSuccess(true);
        setIsQuestionFormOpen(false);
        setTimeout(() => {
          setShowPostSuccess(false);
        }, 3000);
      } else {
        setIsQuestionFormOpen(false);
      }
      setEditingQuestion(null);
      setQuestionFormData({ question: "", description: "" });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to post question");
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!userId) return;
    const answerText = answerInputs[questionId]?.trim() || editingAnswers[questionId]?.answer.trim();
    if (!answerText) return;

    try {
      if (editingAnswers[questionId]) {
        const { error } = await supabase
          .from("community_answers")
          .update({
            answer: answerText,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAnswers[questionId]!.id);
        if (error) throw error;
        setEditingAnswers((prev) => ({ ...prev, [questionId]: null }));
      } else {
        const { error } = await supabase.from("community_answers").insert([
          {
            question_id: questionId,
            user_id: userId,
            answer: answerText,
          },
        ]);
        if (error) throw error;
      }
      setAnswerInputs((prev) => ({ ...prev, [questionId]: "" }));
      await fetchQuestions();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to post answer");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const { error } = await supabase
        .from("community_questions")
        .delete()
        .eq("id", questionId);
      if (error) throw error;
      await fetchQuestions();
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete question");
    }
  };

  const handleDeleteAnswer = async (answerId: string, questionId: string) => {
    if (!confirm("Are you sure you want to delete this answer?")) return;
    try {
      const { error } = await supabase.from("community_answers").delete().eq("id", answerId);
      if (error) throw error;
      await fetchQuestions();
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete answer");
    }
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionFormData({
      question: q.question,
      description: q.description || "",
    });
    setIsQuestionFormOpen(true);
  };

  const openEditAnswer = (questionId: string, answer: Answer) => {
    setEditingAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setAnswerInputs((prev) => ({ ...prev, [questionId]: answer.answer }));
  };

  const cancelEditAnswer = (questionId: string) => {
    setEditingAnswers((prev) => ({ ...prev, [questionId]: null }));
    setAnswerInputs((prev) => ({ ...prev, [questionId]: "" }));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-20 flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500">Loading community...</p>
      </div>
    );
  }

  const openQuestionForm = () => {
    setIsQuestionFormOpen(true);
    setEditingQuestion(null);
    setQuestionFormData({ question: "", description: "" });
    setShowPostSuccess(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 relative">
      {/* Success Message */}
      {showPostSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Question posted successfully!</p>
              <p className="text-gray-400 text-sm">Your question is now visible to the community</p>
            </div>
          </div>
          <button
            onClick={openQuestionForm}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Another
          </button>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community Q&A</h1>
          <p className="text-gray-400">Ask questions and help others by sharing your knowledge</p>
        </div>
        <button
          onClick={openQuestionForm}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Ask Question
        </button>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={openQuestionForm}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center group"
        aria-label="Post Question"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </button>

      {/* Question Form Modal */}
      {isQuestionFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl max-w-2xl w-full p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingQuestion ? "Edit Question" : "Ask a Question"}
            </h2>
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Question *
                </label>
                <input
                  type="text"
                  value={questionFormData.question}
                  onChange={(e) =>
                    setQuestionFormData((prev) => ({ ...prev, question: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="What would you like to ask?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={questionFormData.description}
                  onChange={(e) =>
                    setQuestionFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Add more details about your question..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuestionFormOpen(false);
                    setEditingQuestion(null);
                    setQuestionFormData({ question: "", description: "" });
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  {editingQuestion ? "Update Question" : "Post Question"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-20">
            <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No questions yet</h3>
            <p className="text-gray-400 mb-6">Be the first to ask a question!</p>
            <button
              onClick={openQuestionForm}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium flex items-center gap-2 mx-auto hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Ask Question
            </button>
          </div>
        ) : (
          questions.map((question) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl glass border border-white/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{question.user_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(question.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{question.question}</h3>
                  {question.description && (
                    <p className="text-gray-400 text-sm mb-4">{question.description}</p>
                  )}
                </div>
                {question.user_id === userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditQuestion(question)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Answers Section */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-4">
                  {answers[question.id]?.length || 0} Answer
                  {(answers[question.id]?.length || 0) !== 1 ? "s" : ""}
                </h4>

                {/* Existing Answers */}
                {answers[question.id]?.map((answer) => (
                  <div key={answer.id} className="mb-4 p-4 rounded-xl bg-zinc-800/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{answer.user_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(answer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {answer.user_id === userId && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditAnswer(question.id, answer)}
                            className="p-1 rounded text-gray-400 hover:text-white"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnswer(answer.id, question.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingAnswers[question.id]?.id === answer.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={answerInputs[question.id] || ""}
                          onChange={(e) =>
                            setAnswerInputs((prev) => ({ ...prev, [question.id]: e.target.value }))
                          }
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAnswerSubmit(question.id)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:opacity-90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => cancelEditAnswer(question.id)}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-sm hover:bg-white/5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300 text-sm">{answer.answer}</p>
                    )}
                  </div>
                ))}

                {/* Answer Input */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={answerInputs[question.id] || ""}
                    onChange={(e) =>
                      setAnswerInputs((prev) => ({ ...prev, [question.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAnswerSubmit(question.id);
                      }
                    }}
                    placeholder="Write your answer..."
                    className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => handleAnswerSubmit(question.id)}
                    disabled={!answerInputs[question.id]?.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Answer
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Community;
