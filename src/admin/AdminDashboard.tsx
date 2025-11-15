"use client";
import React, { useEffect, useState } from "react";

type AdminDashboardProps = {
  setCurrentView: (view: string) => void;
};

export default function AdminDashboard({ setCurrentView }: AdminDashboardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Basic client-side protection: check sessionStorage set by AdminLogin
    try {
      const isAdmin = sessionStorage.getItem("isAdmin");
      if (isAdmin === "1") {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        // If not authorized, return to home quickly
        setTimeout(() => setCurrentView("home"), 600);
      }
    } catch {
      setAuthorized(false);
      setTimeout(() => setCurrentView("home"), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("isAdmin");
    setCurrentView("home");
  };

  // Example admin actions (placeholders)
  const handleRefreshStats = async () => {
    setLoading(true);
    // placeholder for real fetch logic
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    // In a real admin panel you'd fetch server stats, manage users, etc.
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-700">Checking admin access...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-red-600">Unauthorized. Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Welcome to the admin control panel.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Stats"}
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <section className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-sm font-medium text-slate-700 mb-2">Site Metrics</h2>
            <div className="text-3xl font-bold text-slate-900">—</div>
            <p className="text-xs text-slate-400 mt-2">Placeholder: add real metrics here</p>
          </section>

          <section className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-sm font-medium text-slate-700 mb-2">User Management</h2>
            <div className="text-sm text-slate-600">View, suspend or manage users from server APIs.</div>
            <div className="mt-3">
              <button
                onClick={() => alert("Implement user management")}
                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm"
              >
                Open User Tools
              </button>
            </div>
          </section>

          <section className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-sm font-medium text-slate-700 mb-2">Content Moderation</h2>
            <div className="text-sm text-slate-600">Review flagged posts, comments and reports.</div>
            <div className="mt-3">
              <button
                onClick={() => alert("Implement moderation")}
                className="px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm"
              >
                Open Moderation Queue
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}