"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";

interface ContactProps {
  setCurrentView: (view: string) => void;
}

export default function Contact({ setCurrentView }: ContactProps) {
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
        <h1 className="ml-4 text-2xl md:text-3xl font-bold">Contact Us</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-700 text-lg md:text-xl mb-4 max-w-2xl">
          Have questions or need assistance? Reach out to us and we will get back to you as soon as possible.
        </p>
        <p className="text-gray-700 text-lg md:text-xl max-w-2xl">
          Email: support@example.com <br />
          Phone: +94 123 456 789
        </p>
      </div>
    </div>
  );
}
