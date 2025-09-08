"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";

interface TermsProps {
  setCurrentView: (view: string) => void;
}

export default function Terms({ setCurrentView }: TermsProps) {
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
        <h1 className="ml-4 text-2xl md:text-3xl font-bold">Terms & Conditions</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
        <p className="text-gray-700 mb-4">
          These terms and conditions outline the rules and regulations for using our platform. By accessing this website, you agree to comply with these terms.
        </p>
        <p className="text-gray-700 mb-4">
          We may update these terms from time to time. It is your responsibility to review them regularly. Continued use of our services constitutes acceptance of any changes.
        </p>
        <p className="text-gray-700 mb-4">
          For any questions regarding these terms, please contact our support team.
        </p>
      </div>
    </div>
  );
}
