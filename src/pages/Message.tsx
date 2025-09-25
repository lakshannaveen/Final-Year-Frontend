"use client";
import { useEffect, useRef, useState } from "react";

interface MessageProps {
  setCurrentView: (view: string) => void;
  recipientId: string;
  recipientUsername: string;
  recipientProfilePic?: string;
  postId?: string;
}

interface ChatMessage {
  _id: string;
  sender: string;
  senderId?: string;
  senderProfilePic?: string;
  recipientId?: string;
  recipientUsername?: string;
  postId?: string;
  text: string;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Message({
  setCurrentView,
  recipientId,
  recipientUsername,
  recipientProfilePic,
  postId,
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
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile/public/${recipientId}`);
        if (!res.ok) return;
        const data = await res.json();
        setProfilePic(data?.user?.profilePic || undefined);
      } catch {
        setProfilePic(undefined);
      }
    })();
  }, [recipientId, recipientProfilePic]);

  // Fetch messages
  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let url = `${API_URL}/api/messages/${recipientId}`;
        if (postId) url += `?postId=${postId}`;
        const res = await fetch(url, {
          headers: token
            ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
            : { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (res.status === 401) {
          alert("You are not authenticated. Please login again.");
        }
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (e) {
        setMessages([]);
      }
      setLoading(false);
    }
    fetchMessages();
  }, [recipientId, postId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message, refetch after send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const tempMsg: ChatMessage = {
      _id: "temp-" + Date.now(),
      sender: "me",
      text: newMessage,
      postId: postId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/messages/${recipientId}`, {
        method: "POST",
        headers: token
          ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
          : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: tempMsg.text, postId }),
      });
      // Refetch messages so sent message is updated correctly
      setTimeout(() => {
        (async () => {
          const token = localStorage.getItem("token");
          let url = `${API_URL}/api/messages/${recipientId}`;
          if (postId) url += `?postId=${postId}`;
          const res = await fetch(url, {
            headers: token
              ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
              : { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (res.status === 401) {
            alert("You are not authenticated. Please login again.");
          }
          const data = await res.json();
          setMessages(data.messages || []);
        })();
      }, 300);
    } catch {}
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
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
          <span className="font-semibold text-lg">{recipientUsername}</span>
          {postId && (
            <span className="ml-4 bg-white text-green-700 px-2 py-1 rounded text-xs border font-mono">
              Post: {postId}
            </span>
          )}
        </div>
      </nav>

      {/* Chat messages */}
      <div
        className="flex-1 px-4 py-3 space-y-2 max-w-3xl mx-auto w-full"
        style={{
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: "6px"
          }}
          className="hide-scrollbar"
        >
          {loading ? (
            <div className="text-center text-gray-400 mt-8">Loading...</div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg._id + idx}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-end gap-2`}>
                  {msg.sender === "me" ? (
                    <div className="order-2 flex items-center">
                      <div className="flex items-center justify-center bg-green-600 rounded-full w-7 h-7 mr-1">
                        {/* Beautiful WhatsApp-style double checkmark for sent message */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M6 13l3.5 3.5L17.5 8.5"
                            stroke="#fff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ filter: "drop-shadow(0 0 1px #fff)" }}
                          />
                          <path
                            d="M9 13l3.5 3.5L20.5 8.5"
                            stroke="#fff"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.7"
                            style={{ filter: "drop-shadow(0 0 1px #fff)" }}
                          />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="order-1 flex items-center">
                      <div className="flex items-center justify-center bg-emerald-700 rounded-full w-7 h-7 mr-1">
                        {/* WhatsApp-style left arrow for received message */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M17 12H7M7 12l4-4M7 12l4 4"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-xs shadow break-words ${msg.sender === "me"
                      ? "bg-green-600 text-white order-1"
                      : "bg-white border order-2 text-green-700"
                      }`}
                    style={{
                      wordBreak: "break-word",
                      minWidth: "0",
                      maxWidth: "320px",
                      boxSizing: "border-box",
                      marginBottom: "2px",
                      marginTop: "2px",
                    }}
                  >
                    {msg.text}
                    <div className="text-xs mt-1 text-right" style={{ color: msg.sender === "me" ? "#bbf7d0" : "#059669" }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
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

      {/* Hide scroll bar CSS */}
      <style jsx global>{`
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
}