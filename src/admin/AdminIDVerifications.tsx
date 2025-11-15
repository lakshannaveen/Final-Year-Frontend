"use client";
import React from "react";

type Props = {
  setCurrentView: (view: string) => void;
};

export default function AdminIDVerifications({ setCurrentView }: Props) {
  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-blue-900">Admin - ID Verifications</h1>
          <button
            onClick={() => setCurrentView("admindashboard")}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Back to Dashboard
          </button>
        </header>
        <div className="p-6 bg-white rounded shadow">
          <p className="text-lg font-medium text-gray-800">Welcome to Admin ID Verifications</p>
        </div>
      </div>
    </div>
  );
}