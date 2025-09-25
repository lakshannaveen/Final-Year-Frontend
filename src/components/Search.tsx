"use client";
import { useState, useEffect } from "react";
import { Sparkle, Loader2 } from "lucide-react";

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
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch suggestions as you type (debounced)
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
        const res = await fetch(
          `${API_URL}/api/feed/search?query=${encodeURIComponent(input.trim())}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (res.status !== 200) {
          throw new Error(data.error || "Server error");
        }
        setSuggestions(Array.isArray(data.feeds) ? data.feeds : []);
        setShowSuggestions(true);
      } catch (err: any) {
        setSuggestions([]);
        setShowSuggestions(false);
        setError(err.message || "AI server error");
      }
      setSuggestLoading(false);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [input]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onChange(input.trim());
    setShowSuggestions(false);
    setError("");
  }

  function handleSelectSuggestion(suggestion: FeedItem) {
    setInput(suggestion.title);
    onChange(suggestion.title);
    setShowSuggestions(false);
    setError("");
  }

  return (
    <div className="relative">
      <form
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl shadow px-4 py-2"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <Sparkle className="text-green-600 w-6 h-6 mr-2" />
        <input
          type="text"
          placeholder="Search services or keywords (AI powered)"
          className="flex-1 bg-transparent outline-none text-lg text-gray-700"
          value={input}
          onChange={handleInput}
          disabled={loading}
          onFocus={() => input.trim() && setShowSuggestions(true)}
        />
        <button
          type="submit"
          className="bg-green-700 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-800 transition"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Search"}
        </button>
      </form>
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 shadow-lg rounded-xl z-10 max-h-80 overflow-y-auto">
          <div className="px-4 pt-2 pb-1 text-sm text-gray-500 font-semibold">Suggestions (AI powered):</div>
          {suggestions.map((sug) => (
            <button
              key={sug._id}
              className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center gap-2"
              onClick={() => handleSelectSuggestion(sug)}
              type="button"
            >
              {sug.user.profilePic ? (
                <img
                  src={sug.user.profilePic}
                  alt={sug.user.username}
                  className="w-7 h-7 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  {sug.user.username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
              <span className="font-semibold text-green-900">{sug.title}</span>
              <span className="text-xs text-gray-500 ml-2">{sug.location}</span>
            </button>
          ))}
          {suggestLoading && (
            <div className="px-4 py-2 text-gray-400 flex items-center">
              <Loader2 className="animate-spin w-4 h-4 mr-2" /> Loading AI suggestions...
            </div>
          )}
        </div>
      )}
      {/* If searching and no suggestions */}
      {showSuggestions && !suggestions.length && !suggestLoading && !error && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 shadow rounded-xl z-10 px-4 py-2 text-gray-400">
          No suggestions found.
        </div>
      )}
      {error && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-red-200 shadow rounded-xl z-10 px-4 py-2 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}