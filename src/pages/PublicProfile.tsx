"use client";
import { useEffect, useState } from "react";

interface PublicProfileProps {
  userId: string;
  setCurrentView?: (view: string) => void;
}

interface UserProfile {
  _id: string;
  username: string;
  bio?: string;
  profilePic?: string;
  coverImage?: string;
  createdAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function PublicProfile({ userId, setCurrentView }: PublicProfileProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/profile/public/${userId}`);
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      }
      setLoading(false);
    }
    if (userId) fetchProfile();
  }, [userId]);

  if (loading) return <div className="text-center py-8">Loading profile...</div>;
  if (!user) return <div className="text-center py-8 text-red-500">User not found.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50">
      <div className="w-full max-w-2xl mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col items-center">
          {user.coverImage && (
            <img src={user.coverImage} alt="Cover" className="w-full h-44 object-cover rounded-xl mb-4" />
          )}
          {user.profilePic ? (
            <img
              src={user.profilePic}
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover border border-gray-300 mb-2"
            />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-4xl border border-gray-300 mb-2">
              {user.username?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="text-2xl font-bold text-green-700 mb-2">{user.username}</div>
          {user.bio && <div className="text-gray-700 mb-2">{user.bio}</div>}
          <div className="text-xs text-gray-500">{user.createdAt && `Joined ${new Date(user.createdAt).toLocaleDateString()}`}</div>
          {setCurrentView && (
            <button
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              onClick={() => setCurrentView("home")}
            >
              ← Back to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}