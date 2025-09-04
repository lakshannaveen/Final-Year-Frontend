"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Menu, X, User } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left: Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-wide flex items-center gap-2"
        >
          <div className="bg-white text-green-700 rounded-lg p-1">
            <Briefcase size={22} />
          </div>
          <span>Doop</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="hover:text-green-200 transition-colors font-medium text-lg"
          >
            Home
          </Link>

          <Link
            href="/profile"
            className="hover:text-green-200 transition-colors font-medium text-lg flex items-center gap-1"
          >
            <User size={18} />
            Profile
          </Link>

          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-white text-green-800 font-semibold hover:bg-green-50 hover:text-green-900 hover:shadow-md transition-all border border-green-100"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="px-4 py-2 rounded-lg border-2 border-white text-white font-semibold hover:bg-white hover:text-green-700 transition-all"
          >
            Register
          </Link>
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
        <div className="md:hidden bg-green-700 text-white flex flex-col gap-4 px-6 py-4 border-t border-green-600">
          <Link
            href="/"
            className="hover:text-green-200 transition-colors font-medium text-lg"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>

          <Link
            href="/profile"
            className="hover:text-green-200 transition-colors font-medium text-lg flex items-center gap-1"
            onClick={() => setMenuOpen(false)}
          >
            <User size={18} />
            Profile
          </Link>

          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold hover:bg-white hover:text-green-900 hover:shadow-lg transition-all duration-300 text-center border-2 border-green-200"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="px-4 py-2 rounded-lg border-2 border-white text-white font-semibold hover:bg-white hover:text-green-800 hover:shadow-lg transition-all duration-300 text-center"
            onClick={() => setMenuOpen(false)}
          >
            Register
          </Link>
        </div>
      )}
    </nav>
  );
}