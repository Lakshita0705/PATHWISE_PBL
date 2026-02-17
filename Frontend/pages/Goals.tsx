import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, Plus, Calendar, CheckCircle, XCircle, Clock, Edit, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface Goal {
  id: string;
  goal_title: string;
  description: string | null;
  deadline: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
}

const Goals: React.FC = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    goal_title: "",
    description: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await fetchGoals(user.id);
      setLoading(false);
    };
    init();
  }, []);

  const fetchGoals = async (uid: string) => {
    const { data, error } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setGoals(data || []);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from("user_goals")
          .update({
            goal_title: formData.goal_title,
            description: formData.description || null,
            deadline: formData.deadline,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_goals").insert([
          {
            user_id: userId,
            goal_title: formData.goal_title,
            description: formData.description || null,
            deadline: formData.deadline,
          },
        ]);
        if (error) throw error;
      }
      await fetchGoals(userId);
      setIsFormOpen(false);
      setEditingGoal(null);
      setFormData({ goal_title: "", description: "", deadline: "" });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to save goal");
    }
  };

  const handleStatusChange = async (goalId: string, newStatus: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from("user_goals")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", goalId);
      if (error) throw error;
      await fetchGoals(userId);
      if (newStatus === "completed") {
        // Show success feedback
        const goal = goals.find((g) => g.id === goalId);
        if (goal) {
          // Optional: show a toast or notification
          console.log(`Goal "${goal.goal_title}" marked as complete!`);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to update goal status");
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    if (!userId) return;
    try {
      const { error } = await supabase.from("user_goals").delete().eq("id", goalId);
      if (error) throw error;
      await fetchGoals(userId);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete goal");
    }
  };

  const openEditForm = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      goal_title: goal.goal_title,
      description: goal.description || "",
      deadline: goal.deadline,
    });
    setIsFormOpen(true);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-20 flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Goals</h1>
          <p className="text-gray-400">Set personalized goals and track your progress</p>
        </div>
        <button
          onClick={() => {
            setIsFormOpen(true);
            setEditingGoal(null);
            setFormData({ goal_title: "", description: "", deadline: "" });
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl max-w-2xl w-full p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingGoal ? "Edit Goal" : "Create New Goal"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Goal Title *
                </label>
                <input
                  type="text"
                  name="goal_title"
                  value={formData.goal_title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Complete React course"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Add details about your goal..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Deadline *
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingGoal(null);
                    setFormData({ goal_title: "", description: "", deadline: "" });
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  {editingGoal ? "Update Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Active Goals ({activeGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeGoals.map((goal) => {
              const daysLeft = getDaysUntilDeadline(goal.deadline);
              const isOverdue = daysLeft < 0;
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl glass border border-white/10 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex-1">{goal.goal_title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(goal)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {goal.description && (
                    <p className="text-gray-400 text-sm mb-4">{goal.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className={isOverdue ? "text-red-400 font-medium" : "text-gray-400"}>
                        {isOverdue
                          ? `${Math.abs(daysLeft)} days overdue`
                          : `${daysLeft} days left`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStatusChange(goal.id, "completed")}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Completed Goals ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedGoals.map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl glass border border-white/10 opacity-75"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-white line-through flex-1">
                    {goal.goal_title}
                  </h3>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {goal.description && (
                  <p className="text-gray-400 text-sm mb-4">{goal.description}</p>
                )}
                <div className="text-sm text-gray-500">
                  Completed on {new Date(goal.updated_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-20">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No goals yet</h3>
          <p className="text-gray-400 mb-6">Create your first goal to start tracking your progress</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium flex items-center gap-2 mx-auto hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default Goals;
