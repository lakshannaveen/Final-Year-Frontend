"use client";

import React from "react";

interface ProfileProps {
  setCurrentView: (view: string) => void;
}

export default function Profile({ setCurrentView }: ProfileProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-green-700">Welcome to Your Profile</h1>
    </div>
  );
}
