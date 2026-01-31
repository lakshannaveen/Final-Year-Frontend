"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import io, { Socket } from "socket.io-client";

interface InboxProps {
  setCurrentView: (view: string) => void;
  onOpenChat: (recipientId: string, recipientUsername: string, recipientProfilePic?: string) => void;
  currentView: string; // For Navbar
  onToggleSidebar?: () => void;
}

interface ChatSummary {
  recipientId: string;
  recipientUsername: string;
  recipientProfilePic?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  recipientStatus?: string; // <-- add status for blinking
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

// Helper for blinking ring
function getRingClass(status?: string) {
  if (!status) return "";
  const lower = status.toLowerCase();
  if (lower.includes("open to work") || status.includes("✅"))
    return "border-4 border-green-400 animate-pulse";
  if (lower.includes("not available") || status.includes("🛑"))
    return "border-4 border-red-400 animate-pulse";
  return "";
}

// Profile avatar with blinking ring
function ProfilePicCircle({
  profilePic,
  username,
  status,
}: {
  profilePic?: string;
  username: string;
  status?: string;
}) {
  const ringClass = getRingClass(status);
  return (
    <span className="relative w-12 h-12 flex items-center justify-center">
      {ringClass && (
        <span
          className={`absolute -inset-1 rounded-full pointer-events-none z-0 ${ringClass}`}
          aria-hidden
        ></span>
      )}
      {profilePic ? (
        <img
          src={profilePic}
          alt={username}
          className="w-12 h-12 rounded-full object-cover border border-green-300 z-10 bg-white"
          width={48}
          height={48}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold border border-green-300 z-10">
          {username?.charAt(0).toUpperCase()}
        </div>
      )}
    </span>
  );
}

export default function Inbox({ setCurrentView, onOpenChat, currentView, onToggleSidebar }: InboxProps) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initialize Socket.IO with JWT cookies
  useEffect(() => {
    socket = io(SOCKET_SERVER_URL, { 
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // Listen for new messages to refresh inbox
    socket.on("receiveMessage", () => {
      // Refresh the inbox to show updated last message and time
      fetchInbox();
    });

    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, []);

  // Fetch inbox data
  const fetchInbox = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/messages/inbox`, {
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
      // If backend is not returning status, you can extend this mapping here if needed.
      setChats(data.chats || []);
    } catch (e) {
      setError("Unexpected error: " + (e as Error).message);
      setChats([]);
    }
    setLoading(false);
  };

  // Mark all messages from a user as read when opening chat
  const handleOpenChat = async (recipientId: string, recipientUsername: string, recipientProfilePic?: string) => {
    try {
      // Mark all messages from this user as read
      await fetch(`${API_URL}/api/messages/${recipientId}/mark-all-read`, {
        method: "PUT",
        credentials: "include",
      });
      
      // Refresh inbox to update unread counts
      fetchInbox();
      
      // Open the chat
      onOpenChat(recipientId, recipientUsername, recipientProfilePic);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
      // Still open the chat even if marking as read fails
      onOpenChat(recipientId, recipientUsername, recipientProfilePic);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInbox();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar first */}
      <Navbar currentView={currentView} setCurrentView={setCurrentView} onToggleSidebar={onToggleSidebar} />

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
                className="flex w-full items-center gap-3 py-4 px-2 bg-white border border-green-200 rounded-xl shadow-sm hover:bg-green-50 transition duration-200 relative"
                onClick={() => {
                  handleOpenChat(chat.recipientId, chat.recipientUsername, chat.recipientProfilePic);
                }}
              >
                <ProfilePicCircle
                  profilePic={chat.recipientProfilePic}
                  username={chat.recipientUsername}
                  status={chat.recipientStatus}
                />
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-lg text-green-900 truncate">
                    {chat.recipientUsername}
                  </div>
                  <div className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    {chat.lastMessage}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
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
                  {chat.unreadCount > 0 && (
                    <div className="bg-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}