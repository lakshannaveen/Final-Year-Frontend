"use client";
import React, { useEffect, useState } from "react";
import {
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ChatBubbleBottomCenterTextIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";

type AdminDashboardProps = {
  setCurrentView: (view: string) => void;
};

export default function AdminDashboard({ setCurrentView }: AdminDashboardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("isAdmin");
    if (isAdmin === "1") {
      setAuthorized(true);
    } else {
      setAuthorized(false);
      setTimeout(() => setCurrentView("home"), 600);
    }
  }, [setCurrentView]); // ✅ ESLint fix

  const handleLogout = () => {
    sessionStorage.removeItem("isAdmin");
    setCurrentView("home");
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
            onClick={handleLogout}
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
      </div>
    </div>
  );
}