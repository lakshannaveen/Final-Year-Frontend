"use client";
import { useState, useRef, useEffect } from "react";
import {
  X,
  Bot,
  Send,
  Clock,
  Zap,
  User,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  ArrowLeft
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  suggestions?: ServiceSuggestion[];
  serviceSearchMeta?: {
    attempted: boolean;
    query: string;
    found: number;
  };
}

interface ServiceSuggestion {
  _id: string;
  user: {
    _id: string;
    username: string;
    profilePic?: string;
    location?: string;
    serviceType?: string;
  };
  title: string;
  location: string;
  price: number;
  priceCurrency: string;
  contactNumber: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  usage: { uses: number; max: number };
  onUsageChange: (usage: { uses: number; max: number }) => void;
  onShowPublicProfile?: (userId: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * List of service-related keywords we try to detect to trigger a provider search
 */
const SERVICE_KEYWORDS = [
  "plumber",
  "plumbing",
  "electrician",
  "electrical",
  "carpenter",
  "woodwork",
  "cleaner",
  "cleaning",
  "tutor",
  "teacher",
  "teaching",
  "driver",
  "chauffeur",
  "chef",
  "cook",
  "babysitter",
  "nanny",
  "gardener",
  "garden",
  "mechanic",
  "repair",
  "painting",
  "painter",
  "ac repair",
  "appliance",
  "mason",
  "welding",
  "decorator",
  "photographer",
  "photo",
  "makeup",
  "beauty",
  "salon",
  "hair",
  "barber",
  "pet",
  "vet",
  "laundry",
  "moving",
  "mover",
  "security",
  "guard",
  "coach",
  "fitness",
  "yoga",
  "trainer"
];

/**
 * Extract meaningful search terms from a user prompt.
 * Returns distinct lowercased terms that match known service keywords
 */
const extractServiceTerms = (prompt: string): string[] => {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const matches = new Set<string>();
  for (const w of words) {
    for (const kw of SERVICE_KEYWORDS) {
      if (kw.includes(w) || w.includes(kw)) {
        matches.add(kw);
      }
    }
  }
  // Fallback: if user typed something like "find plumber near me"
  if (matches.size === 0) {
    // Heuristic: include nouns after verbs like find / need / want
    const idx = words.findIndex((w) => ["find", "need", "want", "search", "looking"].includes(w));
    if (idx !== -1 && words[idx + 1]) {
      matches.add(words[idx + 1]);
    }
  }
  return Array.from(matches).slice(0, 4);
};

/**
 * Decide if a prompt is a service search intent
 */
const isServiceIntent = (prompt: string): boolean => {
  const lower = prompt.toLowerCase();
  if (/(find|search|looking for|need|want|near|in)\b/.test(lower)) return true;
  return SERVICE_KEYWORDS.some((kw) => lower.includes(kw));
};

/**
 * Rank service suggestions by how well they match the prompt.
 * Simple scoring based on keyword hits in title, location, serviceType and username.
 */
const rankSuggestions = (prompt: string, suggestions: ServiceSuggestion[]): ServiceSuggestion[] => {
  if (!suggestions.length) return suggestions;
  const terms = extractServiceTerms(prompt);
  if (!terms.length) return suggestions;

  return [...suggestions]
    .map((s) => {
      const haystack =
        `${s.title} ${s.location} ${s.user?.serviceType || ""} ${s.user?.username || ""}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (haystack.includes(t)) score += 5;
        // partial overlaps
        const parts = t.split(/\s+/);
        for (const p of parts) {
          if (p.length > 3 && haystack.includes(p)) score += 2;
        }
      }
      // Prefer those with a price (if some are missing)
      if (typeof s.price === "number" && s.price >= 0) score += 1;
      return { suggestion: s, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.suggestion);
};

export default function AIAssistant({
  isOpen,
  onClose,
  usage,
  onUsageChange,
  onShowPublicProfile
}: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: "helpful" | "not-helpful" }>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch usage when opened
  useEffect(() => {
    const fetchAIUsage = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/usage`);
        if (res.ok) {
          const data = await res.json();
            onUsageChange({ uses: data.uses, max: data.max });
        }
      } catch {
        // silent
      }
    };

    if (isOpen) {
      fetchAIUsage();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, onUsageChange]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, aiLoading]);

  const handleAIChat = async () => {
    if (!prompt.trim() || usage.uses >= usage.max || aiLoading) return;

    const cleanPrompt = prompt.trim();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: cleanPrompt,
      timestamp: new Date()
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setAiError(null);
    setAiLoading(true);

    try {
      const context = chatHistory.slice(-6).map((msg) => ({
        type: msg.type,
        content: msg.content
      }));

      const serviceIntent = isServiceIntent(cleanPrompt);
      let serviceSuggestions: ServiceSuggestion[] = [];
      let serviceAttempted = false;

      if (serviceIntent) {
        serviceAttempted = true;
        try {
          // Compose a refined search query
            const terms = extractServiceTerms(cleanPrompt);
          // If we have extracted terms, join them; else fallback to entire prompt
          const effectiveQuery = terms.length ? terms.join(" ") : cleanPrompt;
          const searchRes = await fetch(
            `${API_URL}/api/feeds/search?query=${encodeURIComponent(effectiveQuery)}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
          );

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const raw = (searchData.feeds || []) as ServiceSuggestion[];

            // Rank & take top 5
            serviceSuggestions = rankSuggestions(cleanPrompt, raw).slice(0, 5);
          }
        } catch (err) {
          console.error("Service search failed:", err);
        }
      }

      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          context
        })
      });

      const data = await res.json();

      // Always update usage after request if possible
      if (typeof data.uses === "number" && typeof data.max === "number") {
        onUsageChange({ uses: data.uses, max: data.max });
      }

      if (!res.ok) {
        if (res.status === 429) {
          setAiError(data.error || "Daily limit reached. Try again tomorrow.");
        } else if (res.status === 400) {
          setAiError(data.error || "Please check your question and try again.");
        } else {
          setAiError(data.error || "Service temporarily unavailable. Please try again.");
        }
      } else if (data.answer) {
        let enhancedAnswer = data.answer;

        if (serviceIntent) {
          if (serviceSuggestions.length > 0) {
            enhancedAnswer += `\n\n✨ I found ${serviceSuggestions.length} service provider${
              serviceSuggestions.length > 1 ? "s" : ""
            } that match your request. Check them below.`;
          } else {
            enhancedAnswer += `\n\n⚠️ No match service provider. Try refining your search (e.g. add location or a more specific service).`;
          }
        }

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: enhancedAnswer,
          timestamp: new Date(),
          suggestions: serviceSuggestions,
          serviceSearchMeta: serviceIntent
            ? {
                attempted: true,
                query: cleanPrompt,
                found: serviceSuggestions.length
              }
            : undefined
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      } else {
        setAiError("No response generated. Please try a different question.");
      }
    } catch {
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

  const clearChat = () => {
    setChatHistory([]);
    setAiError(null);
    setFeedback({});
  };

  const handleFeedback = (messageId: string, isHelpful: boolean) => {
    setFeedback((prev) => ({
      ...prev,
      [messageId]: isHelpful ? "helpful" : "not-helpful"
    }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const handleProviderClick = (userId: string) => {
    if (onShowPublicProfile) {
      onClose();
      onShowPublicProfile(userId);
    }
  };

  const quickQuestions = [
    {
      question: "What is Doop and how does it work?",
      icon: "🤔",
      category: "Platform Basics"
    },
    {
      question: "How do I book a cleaning service?",
      icon: "🧹",
      category: "Services"
    },
    {
      question: "What services are available in my area?",
      icon: "📍",
      category: "Services"
    },
    {
      question: "How to become a service provider?",
      icon: "💼",
      category: "Providers"
    },
    {
      question: "Tell me about your pricing structure",
      icon: "💰",
      category: "Pricing"
    },
    {
      question: "How to contact customer support?",
      icon: "📞",
      category: "Support"
    },
    {
      question: "What makes Doop different from others?",
      icon: "⭐",
      category: "Platform Basics"
    },
    {
      question: "How are service providers verified?",
      icon: "✅",
      category: "Safety"
    },
    {
      question: "What is your cancellation policy?",
      icon: "📝",
      category: "Policies"
    },
    {
      question: "Find plumber near me",
      icon: "🔧",
      category: "Services"
    }
  ];

  const handleQuickQuestion = (question: string) => {
    setPrompt(question);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const groupedQuestions = quickQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, typeof quickQuestions>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white min-h-screen h-full w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white p-4 sm:p-6 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-white hover:text-emerald-200 transition p-1 sm:p-2 rounded-lg hover:bg-white/10 active:scale-95 mr-2"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="bg-white/20 p-2 rounded-xl shadow-lg">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300" />
              Doop AI Assistant
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm">
              Your intelligent helper for all things Doop
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Zap size={12} className="text-yellow-300" />
              <span className="hidden xs:inline">
                {usage.max - usage.uses} questions left
              </span>
              <span className="xs:hidden">{usage.max - usage.uses} left</span>
            </div>
          </div>
          
            

        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gradient-to-b from-gray-50 to-emerald-50">
          {/* Welcome and Quick Questions */}
          {chatHistory.length === 0 && !aiLoading && (
            <div className="text-center py-8 sm:py-12">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-emerald-100 max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare size={28} className="text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">
                  Welcome to Doop AI Assistant! 👋
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
                  I&apos;m your intelligent assistant here to help with anything about
                  the Doop platform. I can answer questions about services, bookings,
                  becoming a provider, pricing, and more!
                </p>

                <div className="space-y-4">
                  <p className="text-sm text-gray-500 font-medium">
                    Quick questions to get started:
                  </p>

                  {Object.entries(groupedQuestions).map(([category, questions]) => (
                    <div key={category} className="space-y-2">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        {category}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {questions.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickQuestion(item.question)}
                            className="w-full text-left p-3 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-all duration-200 text-sm text-emerald-800 font-medium hover:shadow-md hover:border-emerald-300 active:scale-95 flex items-center gap-2 group"
                          >
                            <span className="text-base group-hover:scale-110 transition-transform">
                              {item.icon}
                            </span>
                            <span className="flex-1 text-left">{item.question}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-800 font-medium mb-2">
                    📊 Daily Usage:
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-700">
                      Questions used today:
                    </span>
                    <span className="text-sm font-bold text-emerald-800">
                      {usage.uses}/{usage.max}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(usage.uses / usage.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="space-y-3 sm:space-y-4">
            {chatHistory.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 shadow-sm ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-br-none shadow-lg"
                        : "bg-white text-gray-800 rounded-bl-none border border-emerald-100 shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {message.type === "ai" && (
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-1.5 rounded-lg mt-0.5 flex-shrink-0">
                          <Bot size={14} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">
                          {message.content}
                        </p>

                        {message.type === "ai" && (
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock size={10} />
                              <span>{formatTime(message.timestamp)}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 mr-2">
                                Was this helpful?
                              </span>
                              <button
                                onClick={() => handleFeedback(message.id, true)}
                                className={`p-1 rounded transition ${
                                  feedback[message.id] === "helpful"
                                    ? "text-green-600 bg-green-100"
                                    : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                }`}
                              >
                                <ThumbsUp size={14} />
                              </button>
                              <button
                                onClick={() => handleFeedback(message.id, false)}
                                className={`p-1 rounded transition ${
                                  feedback[message.id] === "not-helpful"
                                    ? "text-red-600 bg-red-100"
                                    : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                }`}
                              >
                                <ThumbsDown size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {message.type === "user" && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-100">
                            <Clock size={10} />
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        )}
                      </div>
                      {message.type === "user" && (
                        <div className="bg-emerald-500 p-1.5 rounded-lg mt-0.5 flex-shrink-0">
                          <User size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Suggestions or No Match Info */}
                {message.serviceSearchMeta?.attempted && (
                  <div className="mt-3 ml-0 sm:ml-10 space-y-2">
                    {message.suggestions && message.suggestions.length > 0 ? (
                      message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion._id}
                          onClick={() => handleProviderClick(suggestion.user._id)}
                          className="w-full text-left bg-white border-2 border-emerald-200 rounded-xl p-3 hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-md hover:shadow-lg group"
                        >
                          <div className="flex items-center gap-3">
                            {suggestion.user.profilePic ? (
                              <img
                                src={suggestion.user.profilePic}
                                alt={suggestion.user.username}
                                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300 group-hover:border-emerald-500 transition-colors"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg border-2 border-emerald-300 group-hover:border-emerald-500 transition-colors">
                                {suggestion.user.username?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                                {suggestion.title}
                              </div>
                              <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{suggestion.location}</span>
                                <span>•</span>
                                <User className="w-3 h-3" />
                                <span>{suggestion.user.username}</span>
                              </div>
                            </div>
                            <div className="text-emerald-700 font-bold whitespace-nowrap text-sm">
                              {suggestion.price} {suggestion.priceCurrency}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="w-full bg-white border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center text-sm text-emerald-700 font-medium">
                        No match service provider for your request. Try different keywords or include a location.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-emerald-100 rounded-2xl rounded-bl-none p-3 sm:p-4 max-w-[80%] shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-1.5 rounded-lg">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Thinking</span>
                        <span className="animate-pulse">...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {aiError && (
              <div className="flex justify-start">
                <div className="bg-red-50 border border-red-200 rounded-2xl rounded-bl-none p-3 sm:p-4 max-w-[80%] shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-red-500 p-1.5 rounded-lg">
                      <X size={14} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-red-800 text-sm font-medium">
                        Unable to process request
                      </p>
                      <p className="text-red-600 text-xs sm:text-sm mt-1">{aiError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-emerald-100 bg-white p-3 sm:p-6 shadow-lg">
        <div className="flex gap-2 sm:gap-3">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border-2 border-emerald-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-gray-800 placeholder-gray-500 bg-white text-sm sm:text-base font-medium transition-all duration-200"
            placeholder={
              usage.uses >= usage.max
                ? "🚫 Daily limit reached - try again tomorrow"
                : "💭 Ask about Doop or search services (e.g. 'find electrician in Colombo')..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={aiLoading || usage.uses >= usage.max}
            maxLength={500}
          />
          <button
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[50px] sm:min-w-[60px] flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none active:scale-95"
            onClick={handleAIChat}
            disabled={aiLoading || !prompt.trim() || usage.uses >= usage.max}
          >
            {aiLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send size={18} className="sm:size-5" />
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-3">
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-emerald-700 transition font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            <span>🗑️</span>
            Clear conversation
          </button>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="font-medium bg-gray-100 px-2 py-1 rounded-lg">
              📊 Used: {usage.uses}/{usage.max} questions today
            </div>
            {usage.uses >= usage.max && (
              <div className="text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-lg">
                🔄 Resets in 24 hours
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}