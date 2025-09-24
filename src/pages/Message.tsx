"use client";
import { useEffect, useRef, useState } from "react";

interface MessageProps {
  setCurrentView: (view: string) => void;
  recipientId: string;
  recipientUsername: string;
  recipientProfilePic?: string; // Optional: pass profile pic if available
}

interface ChatMessage {
  _id: string;
  sender: string;
  senderProfilePic?: string;
  text: string;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Message({
  setCurrentView,
  recipientId,
  recipientUsername,
  recipientProfilePic,
}: MessageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Chat header: fetch recipient profile pic (if not already passed)
  const [profilePic, setProfilePic] = useState<string | undefined>(recipientProfilePic);
  useEffect(() => {
    if (recipientProfilePic) {
      setProfilePic(recipientProfilePic);
      return;
    }
    // Optionally fetch profile pic using recipientId
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile/${recipientId}`);
        if (!res.ok) return;
        const data = await res.json();
        setProfilePic(data?.user?.profilePic || undefined);
      } catch {
        setProfilePic(undefined);
      }
    })();
  }, [recipientId, recipientProfilePic]);

  // Fetch chat messages
  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      try {
        // Replace with your API endpoint to fetch chat
        const res = await fetch(`${API_URL}/api/messages/${recipientId}`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        setMessages([]);
      }
      setLoading(false);
    }
    fetchMessages();
  }, [recipientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const tempMsg: ChatMessage = {
      _id: "temp-" + Date.now(),
      sender: "me",
      text: newMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");
    try {
      await fetch(`${API_URL}/api/messages/${recipientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tempMsg.text }),
      });
      // Optionally refresh messages
    } catch {
      // error handling (optional)
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar (green theme, just like rest of app) */}
      <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          {/* Back button: uses ONLY setCurrentView, never reloads the page */}
          <button
            className="text-white mr-3 p-2 rounded-lg hover:bg-green-600 transition"
            onClick={() => setCurrentView("home")}
            aria-label="Back"
            type="button"
          >
            {/* Left Arrow SVG */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Profile pic and username */}
          {profilePic ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profilePic}
              alt={recipientUsername}
              className="w-10 h-10 rounded-full object-cover border border-white mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-xl mr-3">
              {recipientUsername?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <span className="font-semibold text-lg">{recipientUsername}</span>
        </div>
      </nav>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="text-center text-gray-400 mt-8">Loading...</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-end gap-2`}>
                {/* Only show avatar for others */}
                {msg.sender !== "me" && (
                  msg.senderProfilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.senderProfilePic}
                      alt={msg.sender}
                      className="w-7 h-7 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-base">
                      {recipientUsername?.[0]?.toUpperCase() || "U"}
                    </div>
                  )
                )}
                <div
                  className={`rounded-2xl px-4 py-2 max-w-xs shadow
                    ${msg.sender === "me" ? "bg-green-600 text-white" : "bg-white border"}`}
                >
                  {msg.text}
                  <div className="text-xs text-gray-400 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        className="max-w-3xl mx-auto w-full flex items-center gap-2 p-4 border-t bg-white"
        onSubmit={handleSend}
      >
        <input
          className="flex-1 rounded-2xl border px-4 py-2 text-gray-800 focus:outline-none"
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-2xl font-semibold hover:bg-green-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}