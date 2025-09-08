"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";

interface PrivacyProps {
  setCurrentView: (view: string) => void;
}

export default function Privacy({ setCurrentView }: PrivacyProps) {
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
        <h1 className="ml-4 text-2xl md:text-3xl font-bold">Privacy Policy</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            Your Privacy Matters
          </h2>

          <p className="text-gray-700 mb-4">
            We respect your privacy and are committed to protecting your personal information. Your data is used solely for providing and improving our services.
          </p>

          <p className="text-gray-700 mb-4">
            This privacy policy outlines how we collect, use, and safeguard your data when you interact with our platform.
          </p>

          <p className="text-gray-700 mb-4">
            We collect minimal personal information necessary for our services, including your name, email, and usage data. All information is stored securely and never shared with unauthorized parties.
          </p>

          <p className="text-gray-700 mb-4">
            You have the right to access, update, or delete your personal information at any time. Please contact our support team for assistance.
          </p>

          <p className="text-gray-700">
            For more details, you can reach out to our support team anytime via email or phone.
          </p>
        </div>
      </div>
    </div>
  );
}
