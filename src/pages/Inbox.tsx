"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Image from "next/image";

interface InboxProps {
  setCurrentView: (view: string) => void;
  onOpenChat: (recipientId: string, recipientUsername: string, recipientProfilePic?: string) => void;
  currentView: string; // For Navbar
}

interface ChatSummary {
  recipientId: string;
  recipientUsername: string;
  recipientProfilePic?: string;
  lastMessage: string;
  lastMessageTime: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Silver skeleton loader for chat item
function ChatSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 py-4 px-2 bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-300" />
      <div className="flex-1">
        <div className="w-24 h-4 bg-gray-300 rounded mb-2" />
        <div className="w-40 h-3 bg-gray-200 rounded" />
      </div>
      <div className="w-10 h-3 bg-gray-200 rounded" />
    </div>
  );
}

export default function Inbox({ setCurrentView, onOpenChat, currentView }: InboxProps) {
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
      {/* Navbar first */}
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Chats */}
      <div className="max-w-2xl mx-auto py-4 px-2">
        {loading ? (
          <div className="flex flex-col gap-3 mt-8">
            {[...Array(4)].map((_, i) => <ChatSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 mt-8">{error}</div>
        ) : chats.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No messages yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {chats.map(chat => (
              <button
                key={chat.recipientId}
                className="flex w-full items-center gap-3 py-4 px-2 bg-white border border-green-200 rounded-xl shadow-sm hover:bg-green-50 transition"
                onClick={() => onOpenChat(chat.recipientId, chat.recipientUsername, chat.recipientProfilePic)}
              >
                {chat.recipientProfilePic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={chat.recipientProfilePic}
                    alt={chat.recipientUsername}
                    className="w-12 h-12 rounded-full object-cover border border-green-300"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold border border-green-300">
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