import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Rocket,
  Target,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface SidebarProps {
  onLogout: () => void;
  user?: any;
  currentRoadmapId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [credibility, setCredibility] = useState(0);
  const navigate = useNavigate();

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Roadmap", path: "/roadmap", icon: Map },
    { name: "Goals", path: "/goals", icon: Target },
    { name: "Mentorship", path: "/mentorship", icon: Users },
    { name: "Community", path: "/community", icon: MessageSquare },
    { name: "Progress", path: "/progress", icon: TrendingUp },
    { name: "Profile", path: "/profile", icon: Settings },
  ];

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  /* ---------------- FETCH CREDIBILITY ---------------- */

  const fetchCredibility = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("credibility_score")
      .eq("id", user.id)
      .single();

    setCredibility(data?.credibility_score || 0);
  };

  useEffect(() => {
    fetchCredibility();

    // Listen for credibility update event
    const handleUpdate = () => fetchCredibility();
    window.addEventListener("credibilityUpdated", handleUpdate);

    return () => {
      window.removeEventListener("credibilityUpdated", handleUpdate);
    };
  }, []);

  /* --------------------------------------------------- */

  const SidebarContent = () => (
    <div className="h-full flex flex-col glass border-r border-white/5">
      <div className="p-6 flex items-center justify-between">
        <div
          className={`flex items-center gap-3 ${
            isCollapsed ? "hidden" : "flex"
          }`}
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Pathwise</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 md:block hidden"
        >
          <ChevronLeft
            className={`transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
              ${
                isActive
                  ? "bg-purple-600/10 text-purple-400 border border-purple-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }
            `
            }
          >
            <item.icon className="w-5 h-5" />
            {!isCollapsed && (
              <span className="font-medium">{item.name}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        {!isCollapsed && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/10">
            <p className="text-xs text-purple-400 font-medium mb-1 uppercase tracking-wider">
              Credibility
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold">{credibility}</span>
              <span className="text-xs text-gray-500">Target: 100</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
                style={{ width: `${credibility}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 w-full text-gray-400 hover:text-red-400 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`fixed md:relative z-40 h-screen transition-all duration-300 md:block hidden ${
          isCollapsed ? "w-24" : "w-72"
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Rocket className="w-6 h-6 text-purple-500" />
          <span className="font-bold text-lg">Pathwise</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-gray-400"
        >
          <Menu />
        </button>
      </div>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-4/5 max-w-[300px]">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
