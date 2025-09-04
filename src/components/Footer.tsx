"use client";
import React from "react";
import { Briefcase } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-green-700 to-emerald-700 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          
          {/* Left: Logo Only */}
          <div className="flex items-center">
            <div className="bg-white text-green-700 rounded-lg p-1">
              <Briefcase size={22} />
            </div>
          </div>

          {/* Center: Pages in Grid Layout */}
          <div className="flex-1 flex justify-center">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-center">
              <a href="#" className="hover:text-green-200 transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-green-200 transition-colors text-sm">
                Terms & Conditions
              </a>
              <a href="#" className="hover:text-green-200 transition-colors text-sm">
                Contact Us
              </a>
              <a href="#" className="hover:text-green-200 transition-colors text-sm">
                Feedback
              </a>
            </div>
          </div>

          {/* Right: Copyright */}
          <div className="text-center md:text-right text-sm text-green-100">
            &copy; {new Date().getFullYear()} Doop. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}