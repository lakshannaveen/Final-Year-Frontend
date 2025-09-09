"use client";

import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import Image from "next/image";

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function Navbar({ currentView, setCurrentView }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left: Logo */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2 hover:opacity-90 transition"
        >
          <Image
            src="/logo.png" // ✅ from public/logo.png
            alt="Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-2xl font-bold tracking-wide">Doop</span>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => handleNavClick("home")}
            className={`hover:text-green-200 transition-colors font-medium text-lg ${
              currentView === "home" ? "text-green-200" : ""
            }`}
          >
            Home
          </button>

          <button
            onClick={() => handleNavClick("profile")}
            className={`hover:text-green-200 transition-colors font-medium text-lg flex items-center gap-1 ${
              currentView === "profile" ? "text-green-200" : ""
            }`}
          >
            <User size={18} />
            Profile
          </button>

          <button
            onClick={() => handleNavClick("signin")}
            className="px-4 py-2 rounded-lg bg-white text-green-800 font-semibold hover:bg-green-50 hover:text-green-900 hover:shadow-md transition-all border border-green-100"
          >
            Sign In
          </button>

          <button
            onClick={() => handleNavClick("register")}
            className={`px-4 py-2 rounded-lg border-2 border-white font-semibold hover:bg-white hover:text-green-700 transition-all ${
              currentView === "register"
                ? "bg-white text-green-700"
                : "text-white"
            }`}
          >
            Register
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg bg-green-800 hover:bg-green-600 transition"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-gradient-to-b from-green-800 to-emerald-700 text-white flex flex-col gap-4 px-6 py-6 border-t border-green-600">
          <button
            onClick={() => handleNavClick("home")}
            className={`font-medium text-lg text-center ${
              currentView === "home" ? "text-green-200" : "hover:text-green-200"
            }`}
          >
            Home
          </button>

          <button
            onClick={() => handleNavClick("profile")}
            className={`font-medium text-lg flex items-center justify-center gap-1 ${
              currentView === "profile"
                ? "text-green-200"
                : "hover:text-green-200"
            }`}
          >
            <User size={18} />
            Profile
          </button>

          <button
            onClick={() => handleNavClick("signin")}
            className={`px-4 py-2 rounded-lg font-semibold text-center transition-all border ${
              currentView === "signin"
                ? "bg-white text-green-700"
                : "bg-white text-green-800 hover:bg-green-50 hover:text-green-900"
            }`}
          >
            Sign In
          </button>

          <button
            onClick={() => handleNavClick("register")}
            className={`px-4 py-2 rounded-lg border-2 font-semibold text-center transition-all ${
              currentView === "register"
                ? "bg-white text-green-700 border-white"
                : "text-white border-white hover:bg-white hover:text-green-700"
            }`}
          >
            Register
          </button>
        </div>
      )}
    </nav>
  );
}
