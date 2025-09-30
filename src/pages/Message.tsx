"use client";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

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
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket;

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
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get current user info on component mount
  useEffect(() => {
    async function getCurrentUser() {
      try {
        console.log("🔍 Getting current user info...");
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log("👤 Current user data:", data);
          if (data.user) {
            setUserId(data.user.id);
          }
        } else {
          console.error("❌ Failed to get current user");
        }
      } catch (error) {
        console.error("❌ Error getting current user:", error);
      }
    }
    
    getCurrentUser();
  }, []);

  // Initialize Socket.IO with JWT cookies
  useEffect(() => {
    console.log("🔄 Initializing Socket.IO connection...");
    
    socket = io(SOCKET_SERVER_URL, { 
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected successfully! Socket ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
    });

    // Listen for new messages
    socket.on("receiveMessage", (message: ChatMessage) => {
      console.log("📨 Received real-time message:", message);
      console.log("👤 Current userId:", userId, "Message senderId:", message.senderId);
      
      // Style as "me" only if senderId matches current user
      const styledMessage = {
        ...message,
        sender: message.senderId === userId ? "me" : message.sender,
      };
      
      console.log("🎨 Styled message for display:", styledMessage);
      
      setMessages((prev) => {
        // Avoid duplicates by checking _id and also check if it's from current user
        const isDuplicate = prev.some((m) => m._id === styledMessage._id);
        const isFromCurrentUser = styledMessage.senderId === userId;
        
        if (isDuplicate) {
          console.log("⚠️ Duplicate message detected, skipping...");
          return prev;
        }
        
        // If it's from current user and we have an optimistic message, replace it
        if (isFromCurrentUser) {
          const hasOptimisticMessage = prev.some(m => m._id && m._id.startsWith('temp-'));
          if (hasOptimisticMessage) {
            console.log("🔄 Replacing optimistic message with real message");
            return prev.filter(m => !m._id.startsWith('temp-')).concat(styledMessage);
          }
        }
        
        console.log("✅ Adding new message to state");
        return [...prev, styledMessage];
      });
    });

    return () => {
      console.log("🧹 Cleaning up Socket.IO connection...");
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [userId]);

  // Chat header: fetch recipient profile pic
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

  // Fetch messages (history)
  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      try {
        let url = `${API_URL}/api/messages/${recipientId}`;
        if (postId) url += `?postId=${postId}`;
        
        console.log("📡 Fetching messages from:", url);
        
        const res = await fetch(url, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          alert("You are not authenticated. Please login again.");
        }
        
        const data = await res.json();
        console.log("📥 Fetched messages:", data.messages);
        setMessages(data.messages || []);
      } catch (e) {
        console.error("❌ Failed to fetch messages:", e);
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

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    
    // Create optimistic message with unique temp ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: ChatMessage = {
      _id: tempId,
      sender: "me",
      senderId: userId || undefined,
      text: messageText,
      createdAt: new Date().toISOString(),
      recipientId,
      recipientUsername,
      postId,
    };

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      console.log("📤 Sending message to API...");
      const res = await fetch(`${API_URL}/api/messages/${recipientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text: messageText, postId }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log("✅ Message sent successfully:", data.message);

      // Remove the optimistic message - the real one will come via socket
      setMessages((prev) => prev.filter(msg => msg._id !== tempId));

      // Don't emit socket event here - the server will handle real-time delivery
      console.log("✅ Message sent via API, real-time delivery handled by server");

    } catch (error) {
      console.error("❌ Failed to send message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(msg => msg._id !== tempId));
      alert("Failed to send message. Please try again.");
      setNewMessage(messageText); // Restore the message
    }
  };

  // Generate unique key for each message
  const getMessageKey = (msg: ChatMessage, index: number) => {
    if (msg._id) {
      return msg._id;
    }
    // For optimistic messages with temp IDs, use the temp ID
    if (msg._id && msg._id.startsWith('temp-')) {
      return msg._id;
    }
    // Fallback to index (shouldn't happen)
    return `msg-${index}`;
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

      {/* Debug Info */}
      <div className="max-w-3xl mx-auto w-full px-4 py-2">
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <div>User ID: {userId || "Not found"}</div>
          <div>Recipient ID: {recipientId}</div>
          <div>Messages: {messages.length}</div>
          <div>Socket: {socket?.connected ? "Connected" : "Disconnected"}</div>
        </div>
      </div>

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
            <div className="text-center text-gray-400 mt-8">Loading messages...</div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={getMessageKey(msg, idx)}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-end gap-2`}>
                  {msg.sender === "me" ? (
                    <div className="order-2 flex items-center">
                      <div className="flex items-center justify-center bg-green-600 rounded-full w-7 h-7 mr-1">
                        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                          <path
                            d="M14 28L22 36L34 20"
                            stroke="#fff"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M24 28L32 36L44 20"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.8"
                          />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="order-1 flex items-center">
                      <div className="flex items-center justify-center bg-emerald-700 rounded-full w-7 h-7 mr-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                    className={`rounded-2xl px-4 py-2 shadow break-words ${msg.sender === "me"
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
                      overflowWrap: "break-word",
                    }}
                  >
                    {msg.text}
                    {msg._id && msg._id.startsWith('temp-') && (
                      <div className="text-xs mt-1 text-right italic" style={{ color: msg.sender === "me" ? "#bbf7d0" : "#059669" }}>
                        Sending...
                      </div>
                    )}
                    {!msg._id.startsWith('temp-') && (
                      <div className="text-xs mt-1 text-right" style={{ color: msg.sender === "me" ? "#bbf7d0" : "#059669" }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
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
          className="flex-1 rounded-2xl border px-4 py-2 text-gray-800 focus:outline-none focus:border-green-500"
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-2xl font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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