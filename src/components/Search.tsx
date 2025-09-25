"use client";
import { useState } from "react";
import { Sparkle } from "lucide-react";

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export default function Search({ value, onChange, loading }: SearchProps) {
  const [input, setInput] = useState(value);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onChange(input.trim());
  }

  return (
    <form
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl shadow px-4 py-2"
      onSubmit={handleSubmit}
    >
      <Sparkle className="text-green-600 w-6 h-6 mr-2" />
      <input
        type="text"
        placeholder="Search services or keywords (AI powered)"
        className="flex-1 bg-transparent outline-none text-lg text-gray-700"
        value={input}
        onChange={handleInput}
        disabled={loading}
      />
      <button
        type="submit"
        className="bg-green-700 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-800 transition"
        disabled={loading}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}