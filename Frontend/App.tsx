import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import Goals from "./pages/Goals";
import Mentorship from "./pages/Mentorship";
import Community from "./pages/Community";
import Progress from "./pages/Progress";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import CareerPaths from "./pages/CareerPaths";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ParticleBackground from "./components/ParticleBackground";

import { supabase } from "./lib/supabaseClient";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- AUTH SYNC WITH SUPABASE ---------------- */

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ---------------- LAYOUT ---------------- */

  const Layout: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const location = useLocation();

    const dashboardRoutes = [
      "/dashboard",
      "/roadmap",
      "/mentorship",
      "/progress",
      "/profile",
    ];

    const isDashboard = dashboardRoutes.includes(
      location.pathname
    );

    const isAuthPage = ["/login", "/register"].includes(
      location.pathname
    );

    if (isDashboard && user) {
      return (
        <div className="flex min-h-screen bg-[#0f0f0f]">
          <Sidebar
            user={user}
            onLogout={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
            {children}
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col relative">
        {!isAuthPage && <Navbar user={user} />}
        <div className="flex-1">{children}</div>
      </div>
    );
  };

  /* ---------------- LOADING SCREEN ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  /* ---------------- ROUTES ---------------- */

  return (
    <Router>
      <ParticleBackground />
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                user ? <Navigate to="/dashboard" /> : <Login />
              }
            />
            <Route
              path="/register"
              element={
                user ? <Navigate to="/dashboard" /> : <Register />
              }
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/paths" element={<CareerPaths />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                user ? (
                  <Dashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/roadmap"
              element={
                user ? (
                  <Roadmap />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/goals"
              element={
                user ? (
                  <Goals />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/mentorship"
              element={
                user ? (
                  <Mentorship />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/community"
              element={
                user ? (
                  <Community />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/progress"
              element={
                user ? (
                  <Progress />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/profile"
              element={
                user ? (
                  <Profile />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </Router>
  );
};

export default App;
