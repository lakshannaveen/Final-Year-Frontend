"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";

interface FeedbackProps {
  setCurrentView: (view: string) => void;
}

export default function Feedback({ setCurrentView }: FeedbackProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Back Button */}
      <div className="flex items-center p-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md">
        <button
          onClick={() => setCurrentView("home")}
          className="p-2 rounded hover:bg-green-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-4 text-2xl md:text-3xl font-bold">Feedback</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-gray-700 text-lg md:text-xl text-center max-w-2xl">
          We value your feedback! Please share your thoughts, suggestions, or concerns with us so we can improve your experience.
        </p>
      </div>
    </div>
  );
}
