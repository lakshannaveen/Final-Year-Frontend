/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { Menu, X, User, Mail, Bot, Send, Clock, Zap, MessageCircle } from "lucide-react";
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

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [usage, setUsage] = useState({ uses: 0, max: 5 });
  const [aiError, setAiError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [aiOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, aiLoading]);

  const handleAIChat = async () => {
    if (!prompt.trim() || usage.uses >= usage.max || aiLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt.trim(),
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setAiError(null);
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
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: data.answer,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMessage]);
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

  const clearChat = () => {
    setChatHistory([]);
    setAiError(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Quick question suggestions
  const quickQuestions = [
    "What is Doop and how does it work?",
    "How do I book a service?",
    "What services are available?",
    "How to become a service provider?"
  ];

  const handleQuickQuestion = (question: string) => {
    setPrompt(question);
    // Auto-submit after a brief delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
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
            {/* AI Chatbox Button - Professional styling */}
            <button
              onClick={() => setAiOpen(true)}
              className="relative group bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-xl border border-emerald-400/20"
              title="AI Assistant - Get instant help"
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-white" />
                <span className="text-white font-medium text-sm hidden sm:block">AI Assistant</span>
              </div>
              
              {/* Usage badge */}
              <div className="absolute -top-2 -right-2 bg-white text-green-700 text-xs font-bold px-2 py-1 rounded-full border-2 border-green-600 shadow-sm">
                {usage.max - usage.uses}
              </div>
              
              {/* Pulse animation when available */}
              {usage.uses < usage.max && (
                <div className="absolute -top-1 -right-1">
                  <div className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></div>
                  <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
                </div>
              )}
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
                className="w-full text-center flex items-center justify-center gap-2 bg-emerald-700/80 hover:bg-emerald-600 py-3 rounded-lg mt-2 font-semibold"
                aria-label="Open AI Chat"
              >
                <MessageCircle size={22} /> AI Assistant ({usage.max - usage.uses} left)
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

      {/* Professional AI Chat Modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Bot size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Doop AI Assistant</h2>
                    <p className="text-emerald-100 text-sm">Get instant help and answers</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Usage indicator */}
                  <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-yellow-300" />
                      <span>{usage.max - usage.uses} questions left today</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setAiOpen(false)}
                    className="text-white hover:text-emerald-200 transition p-2 rounded-lg hover:bg-white/10"
                    aria-label="Close AI Chat"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {chatHistory.length === 0 && !aiLoading && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
                    <Bot size={48} className="text-emerald-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to Doop AI Assistant!</h3>
                    <p className="text-gray-600 mb-6">I am here to help you with anything about Doop platform, services, or general questions.</p>
                    
                    {/* Quick Questions */}
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 font-medium">Try asking:</p>
                      {quickQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickQuestion(question)}
                          className="w-full text-left p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition text-sm text-emerald-800 font-medium"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="space-y-4">
                {chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.type === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {message.type === 'ai' && (
                          <div className="bg-emerald-100 p-1 rounded-lg mt-1">
                            <Bot size={14} className="text-emerald-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </p>
                          <div className={`flex items-center gap-1 mt-2 text-xs ${
                            message.type === 'user' ? 'text-emerald-100' : 'text-gray-500'
                          }`}>
                            <Clock size={12} />
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                        {message.type === 'user' && (
                          <div className="bg-emerald-500 p-1 rounded-lg mt-1">
                            <User size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading Indicator */}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 max-w-[80%]">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-1 rounded-lg">
                          <Bot size={14} className="text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {aiError && (
                  <div className="flex justify-start">
                    <div className="bg-red-50 border border-red-200 rounded-2xl rounded-bl-none p-4 max-w-[80%]">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-1 rounded-lg">
                          <X size={14} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-red-800 text-sm font-medium">Unable to process request</p>
                          <p className="text-red-600 text-sm mt-1">{aiError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-6">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-gray-800 placeholder-gray-500 bg-white text-sm font-medium"
                  placeholder={
                    usage.uses >= usage.max 
                      ? "Daily limit reached - try again tomorrow" 
                      : "Ask me anything about Doop, services, or general topics..."
                  }
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={aiLoading || usage.uses >= usage.max}
                  maxLength={500}
                />
                <button
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none"
                  onClick={handleAIChat}
                  disabled={aiLoading || !prompt.trim() || usage.uses >= usage.max}
                >
                  {aiLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
              
              {/* Footer Info */}
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={clearChat}
                  className="text-xs text-gray-500 hover:text-gray-700 transition font-medium"
                >
                  Clear conversation
                </button>
                <div className="text-xs text-gray-500 font-medium">
                  {usage.uses}/{usage.max} questions used today
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}