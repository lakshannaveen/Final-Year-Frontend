"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkle, Loader2, SearchIcon, MapPin, User, Tag, AlertCircle } from "lucide-react";

interface FeedUser {
  _id: string;
  username: string;
  profilePic?: string;
}

interface FeedItem {
  _id: string;
  user: FeedUser;
  title: string;
  location: string;
  contactNumber: string;
  price: number;
  priceType: string;
  priceCurrency: string;
  photo?: string;
  video?: string;
  websiteLink?: string;
  description?: string;
  createdAt: string;
}

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Search({
  value,
  onChange,
  loading,
}: SearchProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<FeedItem[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check AI service status on component mount
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/feeds/ai-status`);
        const data = await res.json();
        setAiStatus(data.available);
      } catch (err) {
        console.error("Failed to check AI status:", err);
        setAiStatus(false);
      }
    };
    checkAIStatus();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search suggestions (keywords)
  useEffect(() => {
    if (!input.trim() || input.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const fetchSearchSuggestions = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/feeds/suggestions?query=${encodeURIComponent(input.trim())}`
        );
        const data = await res.json();
        setSearchSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        setSearchSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSearchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [input]);

  // Fetch feed suggestions as you type (debounced)
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setError("");
      return;
    }

    setSuggestLoading(true);
    setError("");
    
    const timer = setTimeout(async () => {
      try {
        console.log("Fetching search results for:", input);
        const res = await fetch(
          `${API_URL}/api/feeds/search?query=${encodeURIComponent(input.trim())}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        const data = await res.json();
        
        if (!res.ok) {
          // Handle different HTTP status codes
          if (res.status === 500) {
            throw new Error("Search service is temporarily unavailable. Please try again.");
          } else if (res.status === 400) {
            throw new Error("Invalid search request.");
          } else {
            throw new Error(data.error || `Server error (${res.status})`);
          }
        }
        
        // Ensure we always have an array, even if the response is malformed
        const feedsArray = Array.isArray(data.feeds) ? data.feeds : [];
        setSuggestions(feedsArray);
        setShowSuggestions(true);
        
        // Show informational message if provided
        if (data.message && !aiStatus) {
          console.log("Search message:", data.message);
        }
        
      } catch (err: any) {
        console.error("Search error:", err);
        setSuggestions([]);
        setShowSuggestions(false);
        
        // More user-friendly error messages
        if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
          setError("Network error. Please check your connection.");
        } else if (err.message.includes('500') || err.message.includes('unavailable')) {
          setError("Search service is temporarily down. Using basic search...");
          // Fallback to local filtering if available
          setShowSuggestions(true);
        } else {
          setError(err.message || "Search failed. Please try again.");
        }
      } finally {
        setSuggestLoading(false);
      }
    }, 600); // Increased debounce time

    return () => clearTimeout(timer);
  }, [input, aiStatus]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setInput(newValue);
    setError("");
    
    // If input is cleared, also clear the search
    if (!newValue.trim()) {
      onChange('');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput) {
      onChange(trimmedInput);
      setShowSuggestions(false);
      setError("");
    }
  }

  function handleSelectSuggestion(suggestion: FeedItem) {
    setInput(suggestion.title);
    onChange(suggestion.title);
    setShowSuggestions(false);
    setError("");
  }

  function handleSelectKeywordSuggestion(keyword: string) {
    setInput(keyword);
    onChange(keyword);
    setShowSuggestions(false);
    setError("");
  }

  function getSuggestionIcon(suggestion: string) {
    const lowerSuggestion = suggestion.toLowerCase();
    
    if (lowerSuggestion.includes('plumbing') || 
        lowerSuggestion.includes('electrical') ||
        lowerSuggestion.includes('cleaning') ||
        lowerSuggestion.includes('repair') ||
        lowerSuggestion.includes('carpentry')) {
      return <Tag className="w-4 h-4 text-blue-600" />;
    } else if (suggestion.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) || suggestion.length <= 15) {
      return <User className="w-4 h-4 text-green-600" />;
    } else {
      return <MapPin className="w-4 h-4 text-red-600" />;
    }
  }

  function getSuggestionType(suggestion: string) {
    const lowerSuggestion = suggestion.toLowerCase();
    
    if (lowerSuggestion.includes('plumbing') || 
        lowerSuggestion.includes('electrical') ||
        lowerSuggestion.includes('cleaning')) {
      return "Service";
    } else if (suggestion.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) || suggestion.length <= 15) {
      return "User";
    } else {
      return "Location";
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl shadow-lg px-4 py-3 hover:shadow-xl transition-shadow focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <SearchIcon className="text-green-600 w-5 h-5 flex-shrink-0" />
        <input
          type="text"
          placeholder={aiStatus ? 
            "Search services, locations, or usernames... (AI Powered)" : 
            "Search services, locations, or usernames... (Basic Search)"}
          className="flex-1 bg-transparent outline-none text-lg text-gray-700 placeholder-gray-500 min-w-0"
          value={input}
          onChange={handleInput}
          disabled={loading}
          onFocus={() => input.trim() && setShowSuggestions(true)}
        />
        
        {!aiStatus && (
          <div className="flex items-center gap-1 text-orange-600 text-sm bg-orange-50 px-2 py-1 rounded-md">
            <AlertCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Basic Search</span>
          </div>
        )}
        
        <button
          type="submit"
          className="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              <span className="hidden sm:inline">Searching...</span>
            </>
          ) : (
            <>
              <SearchIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </>
          )}
        </button>
      </form>

      {/* Enhanced Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || searchSuggestions.length > 0 || suggestLoading) && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 shadow-2xl rounded-xl z-50 max-h-96 overflow-y-auto">
          {/* Keyword Suggestions */}
          {searchSuggestions.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-2 text-sm text-gray-700 font-semibold border-b bg-gray-50 flex items-center gap-2 rounded-t-xl">
                <Sparkle className="w-4 h-4 text-green-600" />
                Quick Search Suggestions
              </div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={`keyword-${index}`}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
                  onClick={() => handleSelectKeywordSuggestion(suggestion)}
                  type="button"
                >
                  {getSuggestionIcon(suggestion)}
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 font-medium truncate">{suggestion}</div>
                    <div className="text-xs text-gray-500 capitalize">{getSuggestionType(suggestion)}</div>
                  </div>
                  <div className="text-green-600 text-sm font-medium">Select</div>
                </button>
              ))}
            </>
          )}

          {/* Feed Results */}
          {suggestions.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-2 text-sm text-gray-700 font-semibold border-b bg-gray-50 flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-green-600" />
                {aiStatus ? "AI-Powered Results" : "Search Results"} ({suggestions.length})
              </div>
              {suggestions.map((sug) => (
                <button
                  key={sug._id}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 border-b last:border-b-0 transition-colors group"
                  onClick={() => handleSelectSuggestion(sug)}
                  type="button"
                >
                  {sug.user?.profilePic ? (
                    <img
                      src={sug.user.profilePic}
                      alt={sug.user.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 group-hover:border-green-500 transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg border-2 border-gray-300 group-hover:border-green-500 transition-colors">
                      {sug.user?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                      {sug.title}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{sug.location}</span>
                      {sug.user?.username && (
                        <>
                          <span>•</span>
                          <User className="w-3 h-3" />
                          <span>{sug.user.username}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-green-700 font-bold whitespace-nowrap text-sm">
                    {sug.price} {sug.priceCurrency}
                  </div>
                </button>
              ))}
            </>
          )}

          {suggestLoading && (
            <div className="px-4 py-4 text-gray-600 flex items-center justify-center">
              <Loader2 className="animate-spin w-5 h-5 mr-3 text-green-600" />
              <span>{aiStatus ? "AI is searching..." : "Searching..."}</span>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {showSuggestions && !suggestions.length && !searchSuggestions.length && !suggestLoading && !error && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 shadow-lg rounded-xl z-50 px-4 py-4 text-gray-500 text-center">
          <div className="flex items-center justify-center gap-2">
            <SearchIcon className="w-4 h-4" />
            <span>No results found. Try different keywords.</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-red-50 border border-red-200 shadow-lg rounded-xl z-50 overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Search Notice</span>
            </div>
            <div className="text-sm text-red-600 mt-1">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}