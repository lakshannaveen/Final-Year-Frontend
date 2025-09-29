/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { Menu, X, User, Mail, Bot } from "lucide-react";
import Image from "next/image";

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

export default function Navbar({ currentView, setCurrentView }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth() as { user: AppUser | null; loading: boolean };

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const avatarLetter = user?.username ? user.username.charAt(0).toUpperCase() : null;

  // AI Chatbox state
  const [aiOpen, setAiOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [usage, setUsage] = useState({ uses: 0, max: 5 });
  const [aiError, setAiError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchAIUsage = async () => {
    try {
      const res = await fetch(`${API_URL}/api/huggingface/usage`);
      if (res.ok) {
        const data = await res.json();
        setUsage({ uses: data.uses, max: data.max });
      }
    } catch (error) {
      console.log('Failed to fetch AI usage:', error);
    }
  };

  useEffect(() => {
    if (aiOpen) {
      fetchAIUsage();
    }
  }, [aiOpen]);

  const handleAIChat = async () => {
    if (!prompt.trim() || usage.uses >= usage.max || aiLoading) return;
    
    setAiError(null);
    setResponse(null);
    setAiLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/huggingface/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Handle different error types
        if (res.status === 429) {
          setAiError(data.error || "Daily limit reached. Try again tomorrow.");
          setUsage({ uses: data.uses || usage.max, max: data.max || usage.max });
        } else if (res.status === 400) {
          setAiError(data.error || "Please check your question and try again.");
        } else {
          setAiError(data.error || "Service temporarily unavailable. Please try again.");
        }
      } else if (data.answer) {
        setResponse(data.answer);
        setUsage({ uses: data.uses, max: data.max });
      } else {
        setAiError("No response generated. Please try a different question.");
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setAiError("Network error. Please check your connection and try again.");
    }
    
    setAiLoading(false);
    setPrompt("");
    
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && prompt.trim() && usage.uses < usage.max && !aiLoading) {
      handleAIChat();
    }
  };

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
      } catch {}
    };
    loadAvatar();
    return () => {
      ignore = true;
    };
  }, [user]);

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-row justify-between items-center">
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
          
          {/* Right: Profile + Hamburger + AI Chat */}
          <div className="flex items-center gap-3">
            {/* AI Chatbox Button - Available to all users */}
            <button
              onClick={() => setAiOpen(true)}
              className="bg-emerald-600 p-2 rounded-full hover:bg-emerald-500 transition relative"
              title="AI Assistant - Ask me anything!"
            >
              <Bot size={22} />
              <span className="sr-only">Chat with AI</span>
              <span className="absolute -top-1 -right-1 bg-white text-green-700 text-xs px-1.5 py-0.5 rounded-full font-bold border border-green-700">
                {usage.max - usage.uses}
              </span>
            </button>
            
            {/* User Profile */}
            {user ? (
              <button
                onClick={() => handleNavClick("profile")}
                aria-label="Profile"
                className={`relative flex items-center justify-center rounded-full p-[2px] transition-all ${
                  currentView === "profile"
                    ? "ring-2 ring-emerald-400"
                    : "ring-2 ring-white/20 hover:ring-emerald-300"
                }`}
              >
                {avatarUrl ? (
                  <span className="block w-8 h-8 rounded-full overflow-hidden bg-white">
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
                  <span className="w-8 h-8 rounded-full bg-white text-green-700 flex items-center justify-center font-bold">
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
            
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg bg-green-800 hover:bg-green-600 transition ml-2"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden">
          {menuOpen && (
            <div className="bg-gradient-to-b from-green-800 to-emerald-700 text-white flex flex-col gap-2 px-4 py-4 border-t border-green-600">
              <button
                onClick={() => handleNavClick("home")}
                className={`w-full text-center ${currentView === "home" ? activeLink : inactiveLink}`}
              >
                Home
              </button>
              {isProvider && (
                <button
                  onClick={() => {
                    handleNavClick("post");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-center ${currentView === "post" ? activeLink : inactiveLink}`}
                >
                  Post a Service
                </button>
              )}
              <button
                onClick={() => {
                  handleNavClick("inbox");
                  setMenuOpen(false);
                }}
                className={`w-full text-center flex items-center justify-center gap-2 ${currentView === "inbox" ? activeLink : inactiveLink}`}
                aria-label="Inbox"
              >
                <Mail size={22} /> Inbox
              </button>
              
              {/* AI Chat in mobile menu */}
              <button
                onClick={() => {
                  setAiOpen(true);
                  setMenuOpen(false);
                }}
                className="w-full text-center flex items-center justify-center gap-2 bg-emerald-700/80 hover:bg-emerald-600 py-2 rounded-lg mt-2"
                aria-label="Open AI Chat"
              >
                <Bot size={22} /> AI Assistant ({usage.max - usage.uses} left)
              </button>
              
              {!user && (
                <>
                  <button
                    onClick={() => {
                      handleNavClick("signin");
                      setMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg font-semibold text-center transition-all border mt-2 ${
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
                    className={`w-full px-4 py-3 rounded-lg border-2 font-semibold text-center transition-all mt-2 ${
                      currentView === "register"
                        ? "bg-white text-green-700 border-white"
                        : "text-white border-white hover:bg-white hover:text-green-700"
                    }`}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* AI Chat Modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setAiOpen(false)}
              className="absolute top-3 right-3 text-green-800 hover:text-red-500 transition"
              aria-label="Close AI Chat"
            >
              <X size={28} />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <Bot size={28} className="text-emerald-600" />
              <h2 className="text-xl font-bold text-green-800">AI Assistant</h2>
              <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                {usage.uses}/{usage.max} used today
              </span>
            </div>
            
            <div className="flex-1 min-h-[120px] max-h-96 overflow-y-auto border-2 border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
              {!response && !aiError && (
                <div className="text-gray-500 text-center py-8">
                  <Bot size={48} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-black font-medium">Hello! I am your AI assistant.</p>
                  <p className="text-black text-sm mt-2">Ask me anything - general knowledge, Doop platform questions, service inquiries, or anything else!</p>
                  <p className="text-black text-sm mt-1">You have {usage.max - usage.uses} questions left today.</p>
                </div>
              )}
              
              {response && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-start gap-2">
                    <Bot size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-green-700 text-sm">AI:</span>
                      <p className="text-gray-900 whitespace-pre-wrap mt-1 text-black">{response}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {aiError && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <X size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-red-700 text-sm">Error:</span>
                      <p className="text-red-800 whitespace-pre-wrap mt-1">{aiError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {aiLoading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                  <span className="text-black">AI is thinking...</span>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 text-black placeholder-gray-500 bg-white"
                placeholder={
                  usage.uses >= usage.max 
                    ? "Daily limit reached - try again tomorrow" 
                    : "Ask me anything... (What is Doop? General knowledge, etc.)"
                }
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={aiLoading || usage.uses >= usage.max}
                maxLength={500}
              />
              <button
                className="bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                onClick={handleAIChat}
                disabled={aiLoading || !prompt.trim() || usage.uses >= usage.max}
              >
                {aiLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Asking...</span>
                  </div>
                ) : (
                  "Ask AI"
                )}
              </button>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 text-center">
              <p className="text-black">Ask me anything! General knowledge, Doop platform help, or service questions • {usage.max} questions per day</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}