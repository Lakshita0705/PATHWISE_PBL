import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const MentorPending: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0a0a0a]">
      <div className="max-w-xl w-full glass rounded-[2rem] border border-white/10 p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Mentor Application</h1>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 mb-6">
          <div className="flex items-start gap-3">
            <Clock3 className="w-5 h-5 text-yellow-300 mt-0.5" />
            <div>
              <p className="text-sm uppercase tracking-wider text-yellow-300 font-bold mb-1">
                Status: Pending Approval
              </p>
              <p className="text-sm text-gray-300">
                Your mentor account is under review. You can log in with the same credentials, and this page
                will be shown until an admin approves your application.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:opacity-90 transition-all"
          >
            Check Again
          </button>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/mentor-login");
            }}
            className="px-5 py-3 rounded-xl border border-white/15 text-gray-200 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorPending;
