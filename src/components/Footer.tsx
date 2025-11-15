"use client";
import React from "react";
import { Facebook, Youtube, Instagram, Phone } from "lucide-react";
import Image from "next/image";

interface FooterProps {
  setCurrentView: (view: string) => void;
}

export default function Footer({ setCurrentView }: FooterProps) {
  return (
    <footer className="bg-gradient-to-r from-green-700 to-emerald-700 text-white mt-12">
      <div className="max-w-full mx-auto px-6 py-8 overflow-hidden">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left: Larger Logo */}
          <div className="flex justify-center items-center p-2 md:p-4">
            <Image
              src="/logo.png" // ✅ from public/logo.png
              alt="Logo"
              width={60} // bigger size for footer
              height={60}
              className="rounded-lg"
            />
          </div>

          {/* Center: Pages in Grid Layout */}
          <div className="flex justify-center mt-4 md:mt-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-center text-sm md:text-sm">
              <button
                onClick={() => setCurrentView("privacy")}
                className="hover:text-green-200 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setCurrentView("terms")}
                className="hover:text-green-200 transition-colors cursor-pointer"
              >
                Terms & Conditions
              </button>
              {/* Removed Contact and Feedback from footer as requested */}
            </div>
          </div>

          {/* Right: Social Media Icons */}
          <div className="flex justify-center gap-4 p-2 md:p-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-200 transition-colors"
            >
              <Facebook size={24} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-200 transition-colors"
            >
              <Youtube size={24} />
            </a>
            <a
              href="https://wa.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-200 transition-colors"
            >
              <Phone size={24} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-200 transition-colors"
            >
              <Instagram size={24} />
            </a>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-6 text-center text-sm md:text-sm text-green-100">
          &copy; 2025 Doop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}