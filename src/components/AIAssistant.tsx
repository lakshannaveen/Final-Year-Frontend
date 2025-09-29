
"use client";
import { useState, useRef, useEffect } from "react";
import { X, Bot, Send, Clock, Zap, User } from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
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
    if (isOpen) {
      fetchAIUsage();
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
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
                onClick={onClose}
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
  );
}