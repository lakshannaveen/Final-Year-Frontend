"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";

interface InboxProps {
  setCurrentView: (view: string) => void;
  onOpenChat: (recipientId: string, recipientUsername: string, recipientProfilePic?: string) => void;
}

interface ChatSummary {
  recipientId: string;
  recipientUsername: string;
  recipientProfilePic?: string;
  lastMessage: string;
  lastMessageTime: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Inbox({ setCurrentView, onOpenChat }: InboxProps) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchInbox() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/messages/inbox`, {
          headers: token
            ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
            : { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) {
          const errText = await res.text();
          setError(`Failed to load inbox (${res.status}): ${errText}`);
          setChats([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setChats(data.chats || []);
      } catch (e) {
        setError("Unexpected error: " + (e as Error).message);
        setChats([]);
      }
      setLoading(false);
    }
    fetchInbox();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Navbar for Inbox (matches your color theme) */}
      <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
          <button
            className="text-white mr-3 p-2 rounded-lg hover:bg-green-600 transition"
            onClick={() => setCurrentView("home")}
            aria-label="Back"
            type="button"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="font-semibold text-lg flex items-center gap-2">
            <Mail size={22} className="inline mr-1" /> Inbox
          </span>
        </div>
      </nav>

      {/* Chats */}
      <div className="max-w-2xl mx-auto py-4 px-2">
        {loading ? (
          <div className="text-center text-gray-400 mt-8">Loading chats...</div>
        ) : error ? (
          <div className="text-center text-red-500 mt-8">{error}</div>
        ) : chats.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No messages yet.</div>
        ) : (
          <div className="divide-y">
            {chats.map(chat => (
              <button
                key={chat.recipientId}
                className="flex w-full items-center gap-3 py-4 px-2 hover:bg-green-50 transition rounded-lg"
                onClick={() => onOpenChat(chat.recipientId, chat.recipientUsername, chat.recipientProfilePic)}
              >
                {chat.recipientProfilePic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={chat.recipientProfilePic}
                    alt={chat.recipientUsername}
                    className="w-12 h-12 rounded-full object-cover border"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center text-white text-xl font-bold">
                    {chat.recipientUsername?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg text-green-900">{chat.recipientUsername}</div>
                  <div className="text-gray-600 text-sm truncate">{chat.lastMessage}</div>
                </div>
                <div className="text-xs text-gray-400 ml-2">
                  {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}