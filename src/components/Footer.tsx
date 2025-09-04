"use client";
import React from "react";
import { Briefcase, Facebook, Youtube, Instagram, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-green-700 to-emerald-700 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Top Row */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          
          {/* Left: Larger Logo */}
          <div className="flex items-center p-2 md:p-4">
            <div className="bg-white text-green-700 rounded-lg p-4">
              <Briefcase size={36} />
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

          {/* Right: Social Media Icons */}
          <div className="flex gap-4 p-2 md:p-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition-colors">
              <Facebook size={24} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition-colors">
              <Youtube size={24} />
            </a>
            <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition-colors">
              <Phone size={24} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition-colors">
              <Instagram size={24} />
            </a>
          </div>
        </div>

        {/* Bottom Row: Left - Middle - Right */}
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center text-sm text-green-100 gap-4">
          {/* Left */}
          <div className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Doop
          </div>

          {/* Middle */}
          <div className="text-center">
            All rights reserved
          </div>

          {/* Right */}
          <div className="text-center md:text-right">
            Powered by Doop
          </div>
        </div>
      </div>
    </footer>
  );
}
