"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { Menu, X, User, Mail, Bot } from "lucide-react";
import Image from "next/image";
import AIAssistant from "./AIAssistant";

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onShowPublicProfile?: (userId: string) => void;
}

interface AppUser {
  username?: string;
  profilePic?: string;
  serviceType?: string;
  [key: string]: string | undefined;
}

function getProfilePicFromUser(u: unknown): string {
  if (typeof u === "object" && u !== null) {
    const obj = u as Record<string, unknown>;
    const pic = obj["profilePic"];
    if (typeof pic === "string") return pic;
  }
  return "";
}

const activeLink =
  "relative font-semibold text-green-50 transition duration-200 px-4 py-2 rounded-lg" +
  " before:absolute before:left-2 before:right-2 before:bottom-1 before:h-1 before:bg-gradient-to-r before:from-emerald-400 before:to-green-500 before:rounded-full before:content-['']";
const inactiveLink =
  "font-medium text-white hover:text-green-100 hover:bg-emerald-800/30 transition duration-200 px-4 py-2 rounded-lg";

export default function Navbar({ currentView, setCurrentView, onShowPublicProfile }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth() as { user: AppUser | null; loading: boolean };

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const avatarLetter = user?.username ? user.username.charAt(0).toUpperCase() : null;

  // AI Chatbox state
  const [aiOpen, setAiOpen] = useState(false);
  const [usage, setUsage] = useState({ uses: 0, max: 10 });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Always fetch initial usage on mount
  const fetchAIUsage = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai/usage`);
      if (res.ok) {
        const data = await res.json();
        setUsage({ uses: data.uses, max: data.max });
      }
    } catch { }
  }, [API_URL]);

  useEffect(() => {
    fetchAIUsage();
  }, [fetchAIUsage]);

  useEffect(() => {
    if (aiOpen) {
      fetchAIUsage();
    }
  }, [aiOpen, fetchAIUsage]);

  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setMenuOpen(false);
  };

  useEffect(() => {
    let ignore = false;
    const loadAvatar = async () => {
      if (!user) {
        setAvatarUrl("");
        return;
      }
      const picFromAuth = getProfilePicFromUser(user);
      if (picFromAuth) {
        setAvatarUrl(picFromAuth);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setAvatarUrl(data?.user?.profilePic || "");
      } catch { }
    };
    loadAvatar();
    return () => {
      ignore = true;
    };
  }, [API_URL, user]);

  const isProvider = user?.serviceType === "posting";

  // Skeleton loading bar
  if (loading) {
    return (
      <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg animate-pulse"></div>
            <span className="text-2xl font-bold tracking-wide">Doop</span>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="h-6 w-20 bg-green-600 rounded animate-pulse mx-3"></div>
            <div className="h-6 w-36 bg-green-600 rounded animate-pulse mx-3"></div>
            <div className="h-6 w-20 bg-green-600 rounded animate-pulse mx-3"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Header Row */}
          <div className="flex flex-row justify-between items-center">
            {/* Left: Logo */}
            <button
              onClick={() => handleNavClick("home")}
              className="flex items-center gap-2 hover:opacity-90 transition"
            >
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
              <span className="text-2xl font-bold tracking-wide">Doop</span>
            </button>

            {/* Desktop Center Menu */}
            <div className="hidden md:flex flex-1 justify-center items-center gap-2">
              <button
                onClick={() => handleNavClick("home")}
                className={currentView === "home" ? activeLink : inactiveLink}
              >
                Home
              </button>
              {isProvider && (
                <button
                  onClick={() => handleNavClick("post")}
                  className={currentView === "post" ? activeLink : inactiveLink}
                >
                  Post a Service
                </button>
              )}
              <button
                onClick={() => handleNavClick("inbox")}
                className={`flex items-center gap-2 ${currentView === "inbox" ? activeLink : inactiveLink}`}
                aria-label="Inbox"
                style={{ justifyContent: "center" }}
              >
                <Mail size={20} />
                <span className="hidden sm:inline">Inbox</span>
              </button>
            </div>

            {/* Right: Desktop - Profile + AI Chat */}
            <div className="hidden md:flex items-center gap-3">
              {/* AI Chatbox Button - Professional styling */}
              <button
                onClick={() => setAiOpen(true)}
                className="relative group bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-xl border border-emerald-400/20"
                title="AI Assistant - Get instant help"
              >
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-white" />
                  <span className="text-white font-medium text-sm">AI Assistant</span>
                </div>

                {/* Pulse animation when available - MOVED BEFORE BADGE */}
                {usage.uses < usage.max && (
                  <div className="absolute -top-1 -right-1 pointer-events-none">
                    <div className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></div>
                    <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
                  </div>
                )}

                {/* Usage badge - MOVED AFTER PULSE so it appears on top */}
                <div className="absolute -top-2 -right-2 bg-white text-green-700 text-xs font-bold px-2 py-1 rounded-full border-2 border-green-600 shadow-sm z-10">
                  {usage.max - usage.uses}
                </div>
              </button>

              {/* User Profile */}
              {user ? (
                <button
                  onClick={() => handleNavClick("profile")}
                  aria-label="Profile"
                  className={`relative flex items-center justify-center rounded-full p-[2px] transition-all ${
                    currentView === "profile"
                      ? "ring-2 ring-emerald-400 shadow-lg"
                      : "ring-2 ring-white/20 hover:ring-emerald-300 hover:shadow-lg"
                  }`}
                >
                  {avatarUrl ? (
                    <span className="block w-8 h-8 rounded-full overflow-hidden bg-white shadow-inner">
                      <img
                        src={avatarUrl}
                        alt="Profile avatar"
                        width={32}
                        height={32}
                        loading="lazy"
                        className="w-8 h-8 object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </span>
                  ) : avatarLetter ? (
                    <span className="w-8 h-8 rounded-full bg-white text-green-700 flex items-center justify-center font-bold shadow-inner">
                      {avatarLetter}
                    </span>
                  ) : (
                    <User size={24} />
                  )}
                </button>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Mobile: Hamburger Menu */}
            <div className="md:hidden flex items-center gap-3">
              {/* AI Assistant Button for Mobile */}
              <button
                onClick={() => setAiOpen(true)}
                className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg hover:from-emerald-400 hover:to-green-500 transition-all duration-200 shadow-lg"
                title="AI Assistant"
              >
                <Bot size={20} className="text-white" />
                <div className="absolute -top-1 -right-1 bg-white text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full border border-green-600 z-10">
                  {usage.max - usage.uses}
                </div>
              </button>

              {/* Mobile Auth Buttons */}
              {!user && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNavClick("signin")}
                    className="px-3 py-1.5 rounded-lg bg-white text-green-800 font-semibold hover:bg-green-50 text-sm transition-all border border-green-100"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavClick("register")}
                    className="px-3 py-1.5 rounded-lg border border-white font-semibold hover:bg-white hover:text-green-700 text-sm transition-all"
                  >
                    Register
                  </button>
                </div>
              )}

              {/* Mobile User Profile */}
              {user && (
                <button
                  onClick={() => handleNavClick("profile")}
                  aria-label="Profile"
                  className={`relative flex items-center justify-center rounded-full p-[2px] transition-all ${
                    currentView === "profile"
                      ? "ring-2 ring-emerald-400 shadow-lg"
                      : "ring-2 ring-white/20 hover:ring-emerald-300 hover:shadow-lg"
                  }`}
                >
                  {avatarUrl ? (
                    <span className="block w-8 h-8 rounded-full overflow-hidden bg-white shadow-inner">
                      <img
                        src={avatarUrl}
                        alt="Profile avatar"
                        width={32}
                        height={32}
                        loading="lazy"
                        className="w-8 h-8 object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </span>
                  ) : avatarLetter ? (
                    <span className="w-8 h-8 rounded-full bg-white text-green-700 flex items-center justify-center font-bold shadow-inner">
                      {avatarLetter}
                    </span>
                  ) : (
                    <User size={20} />
                  )}
                </button>
              )}

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg bg-green-800 hover:bg-green-600 transition"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className="md:hidden mt-3">
            {menuOpen && (
              <div className="bg-gradient-to-b from-green-800 to-emerald-700 text-white flex flex-col gap-2 px-4 py-4 rounded-lg border border-green-600">
                <button
                  onClick={() => handleNavClick("home")}
                  className={`w-full text-center py-3 rounded-lg ${
                    currentView === "home" ? activeLink : inactiveLink
                  }`}
                >
                  Home
                </button>
                {isProvider && (
                  <button
                    onClick={() => {
                      handleNavClick("post");
                      setMenuOpen(false);
                    }}
                    className={`w-full text-center py-3 rounded-lg ${
                      currentView === "post" ? activeLink : inactiveLink
                    }`}
                  >
                    Post a Service
                  </button>
                )}
                <button
                  onClick={() => {
                    handleNavClick("inbox");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-center flex items-center justify-center gap-2 py-3 rounded-lg ${
                    currentView === "inbox" ? activeLink : inactiveLink
                  }`}
                  aria-label="Inbox"
                >
                  <Mail size={20} /> Inbox
                </button>

                {/* Additional AI Chat option in mobile menu */}
                <button
                  onClick={() => {
                    setAiOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-center flex items-center justify-center gap-2 bg-emerald-700/80 hover:bg-emerald-600 py-3 rounded-lg mt-2 font-semibold"
                  aria-label="Open AI Chat"
                >
                  <Bot size={20} /> AI Assistant ({usage.max - usage.uses} left)
                </button>

                {/* Additional Auth options in mobile menu for consistency */}
                {!user && (
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={() => {
                        handleNavClick("signin");
                        setMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg font-semibold text-center transition-all border ${
                        currentView === "signin"
                          ? "bg-white text-green-700"
                          : "bg-white text-green-800 hover:bg-green-50 hover:text-green-900"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        handleNavClick("register");
                        setMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg border-2 font-semibold text-center transition-all ${
                        currentView === "register"
                          ? "bg-white text-green-700 border-white"
                          : "text-white border-white hover:bg-white hover:text-green-700"
                      }`}
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* AI Assistant Component */}
      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        usage={usage}
        onUsageChange={setUsage}
        onShowPublicProfile={onShowPublicProfile}
      />
    </>
  );
}