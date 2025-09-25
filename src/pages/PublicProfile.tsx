"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Globe,
  Phone,
  Image as ImageIcon,
  MessageCircle
} from "lucide-react";

interface PublicProfileProps {
  userId: string;
  setCurrentView: (view: string, navData?: any) => void;
}

interface UserProfile {
  _id: string;
  username: string;
  phone?: string;
  website?: string;
  serviceType: "finding" | "posting";
  createdAt?: string;
  bio?: string;
  profilePic?: string;
  coverImage?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Simple skeleton loader
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 ${className}`}></div>;
}

export default function PublicProfile({ userId, setCurrentView }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/profile/public/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setProfile(data.user);
        } else {
          setError(data.errors?.server || "Failed to fetch profile.");
        }
      } catch {
        setError("Error connecting to server.");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  const getInitial = (name = "") => name.charAt(0).toUpperCase();

  const handleNavigate = (navFn: () => void) => {
    navFn();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100">
        <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden p-6">
          <Skeleton className="w-full h-48 sm:h-56 mb-[-64px] rounded-xl" />
          <div className="flex flex-col items-center -mt-20 sm:-mt-24 mb-4">
            <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white mb-2" />
            <Skeleton className="w-48 h-8 rounded-lg mb-2" />
            <Skeleton className="w-24 h-6 rounded-lg mb-2" />
          </div>
          <div className="flex flex-col items-center gap-2 mb-6">
            <Skeleton className="w-32 h-6 rounded-full" />
            <Skeleton className="w-32 h-6 rounded-full" />
          </div>
          <Skeleton className="w-full h-20 rounded-lg mb-6" />
          <Skeleton className="w-full h-24 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100">
        <div className="text-center">
          <p className="text-lg text-red-700 font-semibold mb-4">{error || "No profile data found."}</p>
          <button
            onClick={() => handleNavigate(() => setCurrentView("home"))}
            className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isPostingAccount = profile.serviceType === "posting";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-4">
      {/* Back Button */}
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center">
        <button
          onClick={() => handleNavigate(() => setCurrentView("home"))}
          className="flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors px-4 py-2 rounded-lg hover:bg-green-100"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
      </div>
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
        {/* Cover Image - Only for posting accounts */}
        {isPostingAccount && (
          <div className="relative h-48 sm:h-56 bg-gradient-to-r from-green-200 to-emerald-200">
            {profile.coverImage ? (
              <img
                src={profile.coverImage}
                alt="Cover"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-green-700 font-bold opacity-20">
                <ImageIcon size={48} />
              </div>
            )}
          </div>
        )}
        {/* Card Content */}
        <div className={`flex flex-col items-center ${isPostingAccount ? "-mt-20 sm:-mt-24" : "pt-8"} pb-8 px-6 sm:px-8`}>
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden">
              {profile.profilePic ? (
                <img
                  src={profile.profilePic}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-6xl font-bold text-white">
                  {getInitial(profile.username)}
                </div>
              )}
            </div>
          </div>
          {/* Info */}
          <div className="w-full text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-800 break-words mb-2">{profile.username}</h1>
            <div className="flex justify-center flex-wrap gap-3 mb-4">
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-sm">
                {isPostingAccount ? "💼 Service Provider" : "🔍 Looking for Services"}
              </span>
              {isPostingAccount && profile.phone && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm flex items-center">
                  <Phone size={14} className="mr-1" />
                  {profile.phone}
                </span>
              )}
              {isPostingAccount && profile.website && (
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm flex items-center hover:bg-blue-200"
                >
                  <Globe size={14} className="mr-1" />
                  Website
                </a>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              Joined:{" "}
              {profile.createdAt &&
                new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </p>
          </div>
          {/* Message Button - navigation logic */}
          <button
            className="mb-6 px-4 py-2 bg-green-700 text-white rounded-full flex items-center gap-2 font-semibold hover:bg-green-800 transition"
            title="Message"
            aria-label="Message"
            onClick={() =>
              handleNavigate(() =>
                setCurrentView("message", {
                  recipientId: profile._id,
                  recipientUsername: profile.username,
                  recipientProfilePic: profile.profilePic,
                })
              )
            }
          >
            <MessageCircle size={22} />
            Message
          </button>
          {/* Contact Information - ONLY for posting accounts */}
          {isPostingAccount && (profile.phone || profile.website) && (
            <div className="w-full max-w-lg mb-6 bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-green-800 font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                {profile.phone && (
                  <div className="flex items-center">
                    <Phone size={16} className="text-green-700 mr-2" />
                    <span className="text-gray-700">{profile.phone}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center">
                    <Globe size={16} className="text-green-700 mr-2" />
                    <a
                      href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Bio only if exists */}
          {profile.bio && (
            <div className="w-full max-w-lg mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-green-800 font-semibold text-lg">About Me</label>
              </div>
              <div className="bg-green-50 text-gray-800 px-5 py-4 rounded-lg border border-green-100 min-h-[120px]">
                <p className="leading-relaxed">{profile.bio}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}