"use client";
import React from "react";
import { X, Phone, Shield, FileText, MessageSquare } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentView: (view: string) => void;
}

export default function Sidebar({ isOpen, onClose, setCurrentView }: SidebarProps) {
  if (!isOpen) return null;

  const menuItems = [
    {
      icon: Phone,
      label: "Contact Us",
      view: "contact"
    },
    {
      icon: Shield,
      label: "Privacy Policy",
      view: "privacy"
    },
    {
      icon: FileText,
      label: "Terms & Conditions",
      view: "terms"
    },
    {
      icon: MessageSquare,
      label: "Feedback",
      view: "feedback"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay - removed dark background to keep page content visible */}
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-green-800 to-emerald-700 shadow-xl transform transition-transform duration-300 ease-in-out border-r border-green-600">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-600/30">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    setCurrentView(item.view);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/20"
                >
                  <item.icon size={20} className="text-green-200" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}