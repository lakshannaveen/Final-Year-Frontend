"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkle, Loader2, SearchIcon, MapPin, User, Tag, AlertCircle, X } from "lucide-react";

interface FeedUser {
  _id: string;
  username: string;
  profilePic?: string;
  location?: string;
  serviceType?: string;
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
  onShowPublicProfile?: (userId: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Example searches for dropdown when focusing search
const EXAMPLE_SEARCHES = [
  "Plumber near Galle",
  "Electrician Colombo",
  "Carpenter Negombo",
  "Babysitter Kandy",
  "Driver Matara",
  "Gardener Jaffna"
];

export default function Search({
  value,
  onChange,
  loading,
  onShowPublicProfile,
}: SearchProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<FeedItem[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showExampleDropdown, setShowExampleDropdown] = useState(false);
  const [error, setError] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<boolean>(true);
  const [searchType, setSearchType] = useState<string>("text");
  const [message, setMessage] = useState<string>("");
  const [nearYou, setNearYou] = useState<FeedItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch AI status
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/feeds/ai-status`);
        const data = await res.json();
        setAiStatus(data.available);
      } catch {
        setAiStatus(false);
      }
    };
    checkAIStatus();
  }, []);

  // Click outside dropdown closes suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowExampleDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close suggestions/example on scroll (for Home page use)
  useEffect(() => {
    function handleScroll() {
      setShowSuggestions(false);
      setShowExampleDropdown(false);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch keyword suggestions
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
      } catch {
        setSearchSuggestions([]);
      }
    };
    const timer = setTimeout(fetchSearchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [input]);

  // Fetch feed suggestions
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setError("");
      setMessage("");
      setSearchType("text");
      setNearYou([]);
      return;
    }
    setSuggestLoading(true);
    setError("");
    setMessage("");
    setSearchType("text");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/feeds/search?query=${encodeURIComponent(input.trim())}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Server error (${res.status})`);
        }
        const feedsArray = Array.isArray(data.feeds) ? data.feeds : [];
        setSuggestions(feedsArray);
        setShowSuggestions(true);
        setSearchType(data.searchType || "text");
        setMessage(data.message || "");
        setNearYou(Array.isArray(data.nearYou) ? data.nearYou : []);
      } catch (err) {
        setSuggestions([]);
        setShowSuggestions(false);
        setError(
          err instanceof Error
            ? err.message
            : "Search failed. Please try again."
        );
        setMessage("");
        setSearchType("error");
        setNearYou([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [input, aiStatus]);

  useEffect(() => {
    setInput(value);
  }, [value]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setInput(newValue);
    setError("");
    if (!newValue.trim()) onChange('');
    setShowExampleDropdown(false);
    if (newValue.trim()) setShowSuggestions(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput) {
      onChange(trimmedInput);
      setShowSuggestions(false);
      setError("");
      setShowExampleDropdown(false);
    }
  }

  function handleFocus() {
    if (!input.trim()) {
      setShowExampleDropdown(true);
    } else {
      setShowSuggestions(true);
    }
  }

  function handleExampleSearchClick(example: string) {
    setInput(example);
    setShowExampleDropdown(false);
    setShowSuggestions(true);
    setError("");
    onChange(example);
  }

  function handleSelectKeywordSuggestion(keyword: string) {
    setInput(keyword);
    setShowSuggestions(false);
    setError("");
    setShowExampleDropdown(false);
    const userObj = suggestions.find(
      sug => sug.user?.username?.toLowerCase() === keyword.toLowerCase()
    );
    if (userObj && onShowPublicProfile && userObj.user._id) {
      onShowPublicProfile(userObj.user._id);
      return;
    }
    onChange(keyword);
  }

  function handleSelectSuggestion(suggestion: FeedItem) {
    setInput(suggestion.title);
    setShowSuggestions(false);
    setError("");
    setShowExampleDropdown(false);
    if (onShowPublicProfile && suggestion.user._id) {
      onShowPublicProfile(suggestion.user._id);
      return;
    }
    onChange(suggestion.title);
  }

  function handleClearInput() {
    setInput("");
    setError("");
    setShowSuggestions(false);
    setShowExampleDropdown(true);
    setNearYou([]);
    onChange("");
  }

  function getSuggestionIcon(suggestion: string) {
    const lower = suggestion.toLowerCase();
    if (
      lower.includes("plumbing") ||
      lower.includes("electrician") ||
      lower.includes("cleaning") ||
      lower.includes("repair") ||
      lower.includes("carpentry")
    )
      return <Tag className="w-4 h-4 text-blue-600" />;
    else if (
      suggestion.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) ||
      suggestion.length <= 15
    )
      return <User className="w-4 h-4 text-green-600" />;
    else return <MapPin className="w-4 h-4 text-red-600" />;
  }

  function getSuggestionType(suggestion: string) {
    const lower = suggestion.toLowerCase();
    if (
      lower.includes("plumbing") ||
      lower.includes("electrician") ||
      lower.includes("cleaning")
    )
      return "Service";
    else if (
      suggestion.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) ||
      suggestion.length <= 15
    )
      return "User";
    else return "Location";
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl shadow-lg px-4 py-3 hover:shadow-xl transition-shadow focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <SearchIcon className="text-green-600 w-6 h-6 flex-shrink-0" />
        <input
          type="text"
          placeholder={aiStatus ? "AI powered search..." : "Search..."}
          className="flex-1 bg-transparent outline-none text-lg text-gray-700 placeholder-gray-500 min-w-0"
          value={input}
          onChange={handleInput}
          disabled={loading}
          onFocus={handleFocus}
        />
        {/* Clear button (cut mark) */}
        {input.trim() && (
          <button
            type="button"
            onClick={handleClearInput}
            className="ml-2 text-gray-400 hover:text-gray-700 focus:text-gray-700 focus:outline-none"
            aria-label="Clear search"
            tabIndex={0}
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {aiStatus && (
          <Sparkle className="text-green-500 w-5 h-5 ml-2" aria-label="AI powered" />
        )}
        <button
          type="submit"
          className="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <SearchIcon className="w-4 h-4" />
          )}
        </button>
      </form>
      {/* Example searches dropdown when focusing on empty input or after clear */}
      {showExampleDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 shadow-2xl rounded-xl z-50">
          <div className="px-4 pt-3 pb-2 text-sm text-gray-700 font-semibold border-b bg-gray-50 flex items-center gap-2 rounded-t-xl">
            <Sparkle className="w-4 h-4 text-green-600" />
            Example searches
          </div>
          {EXAMPLE_SEARCHES.map((ex, i) => (
            <button
              key={ex}
              className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
              onClick={() => handleExampleSearchClick(ex)}
              type="button"
            >
              <SearchIcon className="w-4 h-4 text-green-600" />
              <div className="flex-1 min-w-0">
                <div className="text-gray-800 font-medium truncate">{ex}</div>
              </div>
              <div className="text-green-600 text-sm font-medium">Search</div>
            </button>
          ))}
        </div>
      )}
      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || searchSuggestions.length > 0 || suggestLoading || nearYou.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 shadow-2xl rounded-xl z-50 max-h-96 overflow-y-auto">
          {(message || searchType !== "text") && (
            <div className="px-4 py-2 text-xs text-gray-500 bg-gray-100 border-b">
              Search powered by <b>{searchType === "ai" ? "AI" : searchType === "near-you" ? "Near You" : "Smart"}</b>: {message}
            </div>
          )}
          {/* Near You Results */}
          {nearYou.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-2 text-sm text-gray-700 font-semibold border-b bg-green-50 flex items-center gap-2 rounded-t-xl">
                <MapPin className="w-4 h-4 text-green-600" />
                Services Near You
              </div>
              {nearYou.map((sug) => (
                <button
                  key={`nearyou-${sug._id}`}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 border-b last:border-b-0 transition-colors group"
                  onClick={() => handleSelectSuggestion(sug)}
                  type="button"
                >
                  {sug.user?.profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
                    <div className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">{sug.title}</div>
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
              <div className="border-t" />
            </>
          )}
          {/* Keyword Suggestions */}
          {searchSuggestions.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-2 text-sm text-gray-700 font-semibold border-b bg-gray-50 flex items-center gap-2 rounded-t-xl">
                <Sparkle className="w-4 h-4 text-green-600" />
                Suggestions
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
                Results ({suggestions.length})
              </div>
              {suggestions.map((sug) => (
                <button
                  key={sug._id}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 border-b last:border-b-0 transition-colors group"
                  onClick={() => handleSelectSuggestion(sug)}
                  type="button"
                >
                  {sug.user?.profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
                    <div className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">{sug.title}</div>
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
              <span>AI searching...</span>
            </div>
          )}
        </div>
      )}
      {/* No Results */}
      {showSuggestions && !suggestions.length && !searchSuggestions.length && !suggestLoading && !error && !nearYou.length && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 shadow-lg rounded-xl z-50 px-4 py-4 text-gray-500 text-center">
          <div className="flex items-center justify-center gap-2">
            <SearchIcon className="w-4 h-4" />
            <span>No results found.</span>
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