"use client";
import React from "react";

interface VerifyProps {
  setCurrentView: (view: string) => void;
}

export default function Verify({ setCurrentView }: VerifyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-green-100 p-8 text-center">
        <h1 className="text-2xl font-bold text-green-800 mb-4">Verify Your Account</h1>
        <p className="text-gray-700 mb-6">
          Welcome! This is the beginning of the verification flow. For now, this page is a placeholder
          — in the next steps we'll add document upload and review status.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentView("profile")}
            className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
          >
            Back to Profile
          </button>

          <button
            onClick={() => setCurrentView("home")}
            className="px-4 py-2 bg-white text-green-700 rounded-lg font-semibold border border-green-200 hover:bg-green-50 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}