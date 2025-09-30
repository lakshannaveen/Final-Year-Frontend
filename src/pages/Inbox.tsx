"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import io, { Socket } from "socket.io-client";

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
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket;

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
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user info on component mount
  useEffect(() => {
    async function getCurrentUser() {
      try {
        console.log("🔍 Inbox - Getting current user info...");
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log("👤 Inbox - Current user data:", data);
          if (data.user) {
            setUserId(data.user.id);
          }
        } else {
          console.error("❌ Inbox - Failed to get current user");
        }
      } catch (error) {
        console.error("❌ Inbox - Error getting current user:", error);
      }
    }
    
    getCurrentUser();
  }, []);

  // Initialize Socket.IO with JWT cookies
  useEffect(() => {
    console.log("🔄 Inbox - Initializing Socket.IO connection...");
    
    socket = io(SOCKET_SERVER_URL, { 
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on("connect", () => {
      console.log("✅ Inbox - Socket.IO connected! Socket ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Inbox - Socket.IO disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Inbox - Socket.IO connection error:", error);
    });

    // Listen for new messages to refresh inbox
    socket.on("receiveMessage", (message: any) => {
      console.log("📨 Inbox - New message received:", message);
      console.log("🔄 Inbox - Refreshing inbox due to new message...");
      
      // Refresh the inbox to show updated last message and time
      fetchInbox();
    });

    return () => {
      console.log("🧹 Inbox - Cleaning up Socket.IO connection...");
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, []);

  // Fetch inbox data
  const fetchInbox = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("📡 Inbox - Fetching inbox data...");
      
      const res = await fetch(`${API_URL}/api/messages/inbox`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Inbox - Failed to load inbox:", res.status, errText);
        setError(`Failed to load inbox (${res.status}): ${errText}`);
        setChats([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log("📥 Inbox - Loaded chats:", data.chats);
      setChats(data.chats || []);
    } catch (e) {
      console.error("❌ Inbox - Unexpected error:", e);
      setError("Unexpected error: " + (e as Error).message);
      setChats([]);
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchInbox();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar first */}
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-green-900">Messages</h1>
        <p className="text-gray-600 mt-1">Your conversations</p>
      </div>

      {/* Debug Info */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <div>User ID: {userId || "Not found"}</div>
          <div>Chats loaded: {chats.length}</div>
          <div>Socket: {socket?.connected ? "Connected" : "Disconnected"}</div>
        </div>
      </div>

      {/* Chats */}
      <div className="max-w-2xl mx-auto py-4 px-2">
        {loading ? (
          <div className="flex flex-col gap-3 mt-4">
            {[...Array(4)].map((_, i) => <ChatSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 mt-8">{error}</div>
        ) : chats.length === 0 ? (
          <div className="text-center text-gray-400 mt-8 py-8">
            <div className="text-6xl mb-4">💬</div>
            <div className="text-lg">No messages yet</div>
            <div className="text-sm mt-2">Start a conversation by messaging someone!</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chats.map(chat => (
              <button
                key={chat.recipientId}
                className="flex w-full items-center gap-3 py-4 px-2 bg-white border border-green-200 rounded-xl shadow-sm hover:bg-green-50 transition duration-200"
                onClick={() => {
                  console.log("💬 Opening chat with:", chat.recipientUsername, chat.recipientId);
                  onOpenChat(chat.recipientId, chat.recipientUsername, chat.recipientProfilePic);
                }}
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
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-lg text-green-900 truncate">
                    {chat.recipientUsername}
                  </div>
                  <div className="text-gray-600 text-sm truncate">
                    {chat.lastMessage}
                  </div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(chat.lastMessageTime).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  <br />
                  {new Date(chat.lastMessageTime).toLocaleTimeString([], { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  })}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}