"use client";
import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import {
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ChatBubbleBottomCenterTextIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type AdminDashboardProps = {
  setCurrentView: (view: string) => void;
};

type UserStats = {
  totalUsers: number;
  serviceSeekerCount: number;
  postingCount: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
};

export default function AdminDashboard({ setCurrentView }: AdminDashboardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("isAdmin");
    if (isAdmin === "1") {
      setAuthorized(true);
      fetchStats(); // Fetch stats when authorized
    } else {
      setAuthorized(false);
      setTimeout(() => setCurrentView("home"), 600);
    }
  }, [setCurrentView]); // ✅ ESLint fix

  const handleLogout = () => {
    sessionStorage.removeItem("isAdmin");
    toast.success("Logged out successfully!");
    setCurrentView("home");
  };

  // API base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/stats`);
      if (response.ok) {
        const data: UserStats = await response.json();
        setStats(data);
      } else {
        console.error("Stats fetch failed with status:", response.status);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-blue-700">Checking admin access...</div>
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
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-semibold text-blue-900">
            Admin Dashboard
          </h1>

          <button
            onClick={() => {
              const confirmed = window.confirm("Are you sure?");
              if (confirmed) {
                handleLogout();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md border border-red-700 hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        {/* Buttons Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* User Management */}
          <button
            onClick={() => setCurrentView("adminusers")}
            className="flex items-center gap-3 p-5 bg-blue-600 text-white rounded-xl text-lg font-medium shadow hover:bg-blue-700"
          >
            <UserGroupIcon className="h-7 w-7 text-white" />
            User Management
          </button>

          {/* Services Management */}
          <button
            onClick={() => setCurrentView("adminservices")}
            className="flex items-center gap-3 p-5 bg-blue-600 text-white rounded-xl text-lg font-medium shadow hover:bg-blue-700"
          >
            <WrenchScrewdriverIcon className="h-7 w-7 text-white" />
            Services Management
          </button>

          {/* Feedbacks */}
          <button
            onClick={() => setCurrentView("adminfeedback")}
            className="flex items-center gap-3 p-5 bg-blue-600 text-white rounded-xl text-lg font-medium shadow hover:bg-blue-700"
          >
            <ChatBubbleBottomCenterTextIcon className="h-7 w-7 text-white" />
            Feedbacks
          </button>

          {/* Contact Inquiries */}
          <button
            onClick={() => setCurrentView("admincontact")}
            className="flex items-center gap-3 p-5 bg-blue-600 text-white rounded-xl text-lg font-medium shadow hover:bg-blue-700"
          >
            <EnvelopeIcon className="h-7 w-7 text-white" />
            Contact Inquiries
          </button>

          {/* ID Verifications */}
          <button
            onClick={() => setCurrentView("adminidverifications")}
            className="flex items-center gap-3 p-5 bg-blue-600 text-white rounded-xl text-lg font-medium shadow hover:bg-blue-700"
          >
            <IdentificationIcon className="h-7 w-7 text-white" />
            ID Verifications
          </button>

          {/* Reports */}
          <button
            onClick={() => setCurrentView("adminreport")}
            className="flex items-center gap-3 p-5 bg-blue-600 text-white rounded-xl text-lg font-medium shadow hover:bg-blue-700"
          >
            <ChartBarIcon className="h-7 w-7 text-white" />
            Reports
          </button>

        </div>

        {/* User Statistics Chart */}
        <div className="mt-10 bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">User Distribution</h2>
          {stats ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Service Seekers', value: stats.serviceSeekerCount, color: '#3B82F6' },
                    { name: 'Service Providers', value: stats.postingCount, color: '#10B981' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3B82F6" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading chart...</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}