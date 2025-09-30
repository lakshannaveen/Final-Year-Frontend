"use client";
import { useState, useRef, useEffect } from "react";
import { X, Bot, Send, Clock, Zap, User, Sparkles, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  usage: { uses: number; max: number };
  onUsageChange: (usage: { uses: number; max: number }) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AIAssistant({ isOpen, onClose, usage, onUsageChange }: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: 'helpful' | 'not-helpful' }>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch usage when opened
  useEffect(() => {
    const fetchAIUsage = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/usage`);
        if (res.ok) {
          const data = await res.json();
          onUsageChange({ uses: data.uses, max: data.max });
        }
      } catch { }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchAIUsage();
      setTimeout(() => inputRef.current?.focus(), 300);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, onUsageChange]);

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
      const context = chatHistory.slice(-6).map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          context
        }),
      });

      const data = await res.json();

      // Always update usage after request
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
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: data.answer,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMessage]);
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
    setFeedback(prev => ({
      ...prev,
      [messageId]: isHelpful ? 'helpful' : 'not-helpful'
    }));
    // Send feedback to backend if required
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Doop-specific quick questions
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
      question: "Do you offer emergency services?",
      icon: "🚨",
      category: "Services"
    }
  ];

  const handleQuickQuestion = (question: string) => {
    setPrompt(question);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Group quick questions by category
  const groupedQuestions = quickQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, typeof quickQuestions>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden border-2 border-emerald-200/50"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl shadow-lg">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-300" />
                  Doop AI Assistant
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm">Your intelligent helper for all things Doop</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Usage indicator */}
              <div className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Zap size={12} className="text-yellow-300" />
                  <span className="hidden xs:inline">{usage.max - usage.uses} questions left</span>
                  <span className="xs:hidden">{usage.max - usage.uses} left</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-white hover:text-emerald-200 transition p-1 sm:p-2 rounded-lg hover:bg-white/10 active:scale-95"
                aria-label="Close AI Chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gradient-to-b from-gray-50 to-emerald-50">
          {chatHistory.length === 0 && !aiLoading && (
            <div className="text-center py-8 sm:py-12">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-emerald-100 max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare size={28} className="text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Welcome to Doop AI Assistant! 👋</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
                  I&apos;m your intelligent assistant here to help with anything about the Doop platform. I can answer questions about services, bookings, becoming a provider, pricing, and more!
                </p>

                {/* Quick Questions with Categories */}
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 font-medium">Quick questions to get started:</p>

                  {Object.entries(groupedQuestions).map(([category, questions]) => (
                    <div key={category} className="space-y-2">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{category}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {questions.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickQuestion(item.question)}
                            className="w-full text-left p-3 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-all duration-200 text-sm text-emerald-800 font-medium hover:shadow-md hover:border-emerald-300 active:scale-95 flex items-center gap-2 group"
                          >
                            <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span className="flex-1 text-left">{item.question}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Usage Info */}
                <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-800 font-medium mb-2">📊 Daily Usage:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-700">Questions used today:</span>
                    <span className="text-sm font-bold text-emerald-800">{usage.uses}/{usage.max}</span>
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
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-br-none shadow-lg'
                      : 'bg-white text-gray-800 rounded-bl-none border border-emerald-100 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {message.type === 'ai' && (
                      <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-1.5 rounded-lg mt-0.5 flex-shrink-0">
                        <Bot size={14} className="text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">
                        {message.content}
                      </p>

                      {/* Feedback buttons for AI messages */}
                      {message.type === 'ai' && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <div className={`flex items-center gap-1 text-xs ${
                            message.type === 'user' ? 'text-emerald-100' : 'text-gray-500'
                          }`}>
                            <Clock size={10} />
                            <span>{formatTime(message.timestamp)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 mr-2">Was this helpful?</span>
                            <button
                              onClick={() => handleFeedback(message.id, true)}
                              className={`p-1 rounded transition ${
                                feedback[message.id] === 'helpful'
                                  ? 'text-green-600 bg-green-100'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, false)}
                              className={`p-1 rounded transition ${
                                feedback[message.id] === 'not-helpful'
                                  ? 'text-red-600 bg-red-100'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Only timestamp for user messages */}
                      {message.type === 'user' && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-emerald-100">
                          <Clock size={10} />
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="bg-emerald-500 p-1.5 rounded-lg mt-0.5 flex-shrink-0">
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
                <div className="bg-white border border-emerald-100 rounded-2xl rounded-bl-none p-3 sm:p-4 max-w-[80%] shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-1.5 rounded-lg">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
                      <p className="text-red-800 text-sm font-medium">Unable to process request</p>
                      <p className="text-red-600 text-xs sm:text-sm mt-1">{aiError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
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
                  : "💭 Ask me anything about Doop services, bookings, or providers..."
              }
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
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

          {/* Footer Info */}
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
    </div>
  );
}