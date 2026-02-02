"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Globe, Phone, Image as ImageIcon, MessageCircle, CheckCircle, Star } from "lucide-react";
import ReviewSection from "./Review";

interface NavigationData {
  recipientId?: string;
  recipientUsername?: string;
  recipientProfilePic?: string;
}

interface PublicProfileProps {
  userId: string;
  setCurrentView: (view: string, navData?: NavigationData) => void;
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
  status?: string;
  isVerified?: boolean;
}

interface FeedUser {
  _id: string;
  username: string;
  profilePic?: string;
  status?: string;
  isVerified?: boolean;
}

interface FeedItem {
  _id: string;
  user: FeedUser;
  title: string;
  location: string;
  contactNumber: string;
  price: number;
  priceType: string;
  priceCurrency: string;
  photo?: string;
  video?: string;
  websiteLink?: string;
  description?: string;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAGE_SIZE = 5;

// --- Skeleton Components ---
function ProfileSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden mb-10">
      <div className="relative h-48 sm:h-56 bg-gradient-to-r from-green-200 to-emerald-200 animate-pulse" />
      <div className="flex flex-col items-center -mt-20 sm:-mt-24 pb-8 px-6 sm:px-8">
        <div className="relative mb-4">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-gray-200 animate-pulse" />
        </div>
        <div className="w-full text-center mb-6">
          <div className="w-48 h-8 bg-gray-200 rounded-lg mx-auto mb-2 animate-pulse" />
          <div className="w-32 h-6 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="flex justify-center flex-wrap gap-3 mb-4">
            <div className="w-32 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="w-40 h-4 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
        <div className="w-full mb-6">
          <div className="w-24 h-6 bg-gray-200 rounded mb-3 animate-pulse" />
          <div className="w-full h-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-row md:flex-row items-stretch p-4 md:p-6 min-h-[240px] animate-pulse mb-4">
      {/* Left side: Profile and media skeleton */}
      <div className="flex flex-col items-center md:items-start mr-4 md:mr-8 min-w-[120px] md:min-w-[120px]">
        <div className="flex flex-col items-center mb-4 md:mb-0">
          <div className="w-16 h-16 rounded-full bg-gray-200 mb-2" />
          <div className="w-20 h-4 rounded bg-gray-200 mb-2" />
          <div className="w-12 h-3 rounded bg-gray-200" />
        </div>
        {/* Media skeleton - mobile only */}
        <div className="md:hidden w-full max-w-[120px]">
          <div className="w-full h-[90px] bg-gray-200 rounded-xl" />
        </div>
      </div>
      {/* Right side: Content skeleton */}
      <div className="flex-1 flex flex-col justify-between py-2">
        <div>
          <div className="w-36 h-6 bg-gray-200 rounded mb-2" />
          <div className="w-28 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-28 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-28 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-40 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-52 h-4 bg-gray-200 rounded" />
        </div>
      </div>
      {/* Media skeleton - desktop only */}
      <div className="hidden md:flex flex-col gap-2 items-center justify-start min-w-[220px] max-w-[220px] ml-8">
        <div className="w-[220px] h-[160px] bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

// --- Helpers ---
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

// --- Main Component ---
export default function PublicProfile({ userId, setCurrentView }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Media modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  const [modalPhotoAlt, setModalPhotoAlt] = useState<string>("");

  // --- Fetch Profile ---
  useEffect(() => {
    setProfileLoading(true);
    fetch(`${API_URL}/api/profile/public/${userId}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data.user || null);
        setProfileError(!data.user ? (data.errors?.server || "No profile found.") : "");
        setProfileLoading(false);
      })
      .catch(() => {
        setProfileError("Error connecting to server.");
        setProfileLoading(false);
      });
  }, [userId]);

  // --- Infinite Scroll ---
  useEffect(() => {
    const handleScroll = () => {
      if (feedLoading || !hasMore) return;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      if (scrollTop + clientHeight >= scrollHeight - 120) setPage(p => p + 1);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [feedLoading, hasMore]);

  // --- Fetch Feeds Paginated ---
  useEffect(() => {
    setFeedLoading(true);
    fetch(`${API_URL}/api/feed/public-paginated/${userId}?page=${page}&limit=${PAGE_SIZE}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.feeds)) {
          setFeeds(prev => {
            const ids = new Set(prev.map(f => f._id));
            return [...prev, ...data.feeds.filter((f: FeedItem) => !ids.has(f._id))];
          });
          setHasMore(page < data.totalPages);
        } else setHasMore(false);
        setFeedLoading(false);
      })
      .catch(() => {
        setHasMore(false);
        setFeedLoading(false);
      });
  }, [page, userId]);

  let photoPressTimer: NodeJS.Timeout | null = null;
  const handlePhotoMouseDown = (photoUrl: string, alt: string) => {
    photoPressTimer = setTimeout(() => {
      setModalPhotoUrl(photoUrl);
      setModalPhotoAlt(alt);
      setShowPhotoModal(true);
    }, 500);
  };
  const handlePhotoMouseUp = () => { if (photoPressTimer) clearTimeout(photoPressTimer); photoPressTimer = null; };
  const handlePhotoTouchStart = (photoUrl: string, alt: string) => {
    photoPressTimer = setTimeout(() => {
      setModalPhotoUrl(photoUrl);
      setModalPhotoAlt(alt);
      setShowPhotoModal(true);
    }, 500);
  };
  const handlePhotoTouchEnd = () => { if (photoPressTimer) clearTimeout(photoPressTimer); photoPressTimer = null; };
  const closeModal = () => { setShowPhotoModal(false); setModalPhotoUrl(null); setModalPhotoAlt(""); };
  const getInitial = (name = "") => name.charAt(0).toUpperCase();

  const displayStatus = profile?.status || "";
  const isOpenToWork = displayStatus.toLowerCase().includes("open to work") || displayStatus.includes("✅");
  const isNotAvailable = displayStatus.toLowerCase().includes("not available") || displayStatus.includes("🛑");
  const ringBaseClass = "absolute -inset-2 rounded-full pointer-events-none z-0";
  const greenRingClass = `${ringBaseClass} border-4 border-green-400 animate-pulse`;
  const redRingClass = `${ringBaseClass} border-4 border-red-400 animate-pulse`;

  // NOTE: Verification badge is now rendered inline next to the username in the heading (see below).

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-4">
      {/* Back Button */}
      <div className="w-full mx-auto mb-6 flex justify-between items-center">
        <button
          onClick={() => setCurrentView("home")}
          className="flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors px-4 py-2 rounded-lg hover:bg-green-100"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
      </div>

      {/* PROFILE CARD */}
      {profileLoading ? (
        <ProfileSkeleton />
      ) : profileError || !profile ? (
        <div className="w-full bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden mb-10 p-10 text-center">
          <p className="text-lg text-red-700 font-semibold mb-4">{profileError || "No profile data found."}</p>
          <button
            onClick={() => setCurrentView("home")}
            className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
          >
            Back to Home
          </button>
        </div>
      ) : (
        <div className="w-full bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden mb-10">
          {/* Cover Image - Only for posting accounts */}
          {profile.serviceType === "posting" && (
            <div className="relative h-48 sm:h-56 bg-gradient-to-r from-green-200 to-emerald-200">
              {profile.coverImage ? (
                <img src={profile.coverImage} alt="Cover" className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-green-700 font-bold opacity-20">
                  <ImageIcon size={48} />
                </div>
              )}
            </div>
          )}
          <div className={`flex flex-col items-center ${profile.serviceType === "posting" ? "-mt-20 sm:-mt-24" : "pt-8"} pb-8 px-6 sm:px-8`}>
            {/* Avatar */}
            <div className="relative mb-4">
              {/* Animated ring element */}
              {isOpenToWork && <div className={greenRingClass} aria-hidden />}
              {isNotAvailable && <div className={redRingClass} aria-hidden />}

              {/* Avatar container */}
              <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden">
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt="Profile" className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-6xl font-bold text-white">
                    {getInitial(profile.username)}
                  </div>
                )}
              </div>

              {/* STATUS BADGE - removed circular dot for Not available as requested.
                  (Open-to-work green badge kept; red visual ring remains around avatar when not available.)
              */}
              {isOpenToWork && (
                <div className="absolute right-12 bottom-0 transform translate-x-1/4 translate-y-1/4 z-20">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-500 ring-2 ring-white" title="Open to work">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              )}
            </div>
            {/* Info */}
            <div className="w-full text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-green-800 break-words mb-2 inline-flex items-center justify-center">
                <span>{profile.username}</span>
                {/* Verification badge placed near the username */}
                {profile.serviceType === "posting" && profile.isVerified && (
                  <span
                    className="ml-3 inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-500 text-white shadow-sm"
                    title="Verified account"
                    aria-label="Verified account"
                  >
                    <CheckCircle size={14} className="text-white" />
                  </span>
                )}
              </h1>
              <div className="flex justify-center flex-wrap gap-3 mb-4">
                <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-sm">
                  {profile.serviceType === "posting" ? "💼 Service Provider" : "🔍 Looking for Services"}
                </span>
                {profile.serviceType === "posting" && profile.phone && (
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm flex items-center">
                    <Phone size={14} className="mr-1" />
                    <a href={`tel:${profile.phone}`} className="hover:underline">{profile.phone}</a>
                  </span>
                )}
                {profile.serviceType === "posting" && profile.website && (
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

              {/* STATUS TEXT BEFORE JOINED DATE */}
              {profile.status && (
                <div className={`font-semibold mb-2 text-sm ${isOpenToWork ? "text-emerald-700" : isNotAvailable ? "text-red-700" : "text-gray-700"}`}>
                  {profile.status}
                </div>
              )}

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
            <button
              className="mb-6 px-4 py-2 bg-green-700 text-white rounded-full flex items-center gap-2 font-semibold hover:bg-green-800 transition"
              title="Message"
              aria-label="Message"
              onClick={() =>
                setCurrentView("message", {
                  recipientId: profile._id,
                  recipientUsername: profile.username,
                  recipientProfilePic: profile.profilePic,
                })
              }
            >
              <MessageCircle size={22} />
              Message
            </button>
            {/* Contact Information - ONLY for posting accounts */}
            {profile.serviceType === "posting" && (profile.phone || profile.website) && (
              <div className="w-full max-w-lg mb-6 bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-green-800 font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {profile.phone && (
                    <div className="flex items-center">
                      <Phone size={16} className="text-green-700 mr-2" />
                      <a href={`tel:${profile.phone}`} className="text-green-700 hover:underline">{profile.phone}</a>
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

                {/* If service provider and verified, show a short verification message */}
                {profile.serviceType === "posting" && profile.isVerified && (
                  <div className="mt-4 p-3 bg-white border border-green-100 rounded-lg flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                        <CheckCircle size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Verified Account</div>
                      <div className="text-sm text-gray-600">This service provider has been identity verified.</div>
                    </div>
                  </div>
                )}
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
      )}

      {/* REVIEWS SECTION */}
      <ReviewSection userId={userId} />

      {/* FEEDS LIST */}
      <div className="w-full bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden p-8">
        <h3 className="text-2xl font-bold text-green-700 mb-6 text-center">
          {profile?.username ? `Posts by ${profile.username}` : "Posts"}
        </h3>
        {feeds.length === 0 && feedLoading ? (
          [...Array(PAGE_SIZE)].map((_, i) => <FeedSkeleton key={i} />)
        ) : feeds.length === 0 ? (
          <div className="text-center text-gray-500">No posts yet.</div>
        ) : (
          feeds.map(feed => {
            const ringClass = getRingClass(feed.user.status);
            return (
              <div
                key={feed._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col md:flex-row mb-6"
                style={{ minHeight: "280px" }}
              >
                {/* Header with profile and basic info */}
                <div className="flex items-center p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100">
                  <div
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors"
                    onClick={() => setCurrentView("publicProfile", { recipientId: feed.user._id, recipientUsername: feed.user.username, recipientProfilePic: feed.user.profilePic })}
                    title={`View ${feed.user.username}'s profile`}
                  >
                    <div className="relative">
                      {/* Blinking ring - OUTSIDE profile pic */}
                      {ringClass && (
                        <span
                          className={`absolute -inset-1 rounded-full pointer-events-none z-0 ${ringClass}`}
                          aria-hidden
                        ></span>
                      )}
                      {feed.user.profilePic ? (
                        <img
                          src={feed.user.profilePic}
                          alt={feed.user.username}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 z-10 bg-white"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white font-bold text-xl border-2 border-gray-200 z-10"
                          aria-label={feed.user.username}
                        >
                          {feed.user.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 text-base">{feed.user.username}</span>
                        {feed.user.isVerified && (
                          <span
                            className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white"
                            title="Verified account"
                            aria-label="Verified account"
                          >
                            <CheckCircle size={12} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{timeAgo(feed.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-4 md:p-6">
                  <div className="space-y-3">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{feed.title}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                          📍
                        </span>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Location</span>
                          <p className="text-gray-900 font-medium">{feed.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                          📞
                        </span>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Contact</span>
                          {feed.contactNumber ? (
                            <a
                              href={`tel:${feed.contactNumber}`}
                              className="text-green-700 font-medium hover:text-green-800 transition-colors"
                              title={`Call ${feed.contactNumber}`}
                            >
                              {feed.contactNumber}
                            </a>
                          ) : (
                            <p className="text-gray-900 font-medium">Not provided</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
                          💰
                        </span>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Price</span>
                          <p className="text-gray-900 font-medium">{feed.price} {feed.priceCurrency} <span className="text-sm text-gray-600">({feed.priceType})</span></p>
                        </div>
                      </div>

                      {feed.websiteLink && (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600">
                            🌐
                          </span>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Website</span>
                            <a
                              href={feed.websiteLink}
                              className="text-blue-600 font-medium hover:text-blue-800 transition-colors block truncate max-w-[200px]"
                              target="_blank"
                              rel="noopener noreferrer"
                              title={feed.websiteLink}
                            >
                              {feed.websiteLink.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {feed.description && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-500 block mb-1">About</span>
                        <p className="text-gray-700 leading-relaxed">{feed.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media section */}
                {(feed.photo || feed.video) && (
                  <div className="md:w-64 p-4 md:p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
                    <div className="w-full max-w-[240px]">
                      {feed.photo && (
                        <img
                          src={feed.photo}
                          alt="Service photo"
                          width={240}
                          height={180}
                          className="w-full h-40 md:h-48 object-cover rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onMouseDown={() => handlePhotoMouseDown(feed.photo!, feed.title)}
                          onMouseUp={handlePhotoMouseUp}
                          onMouseLeave={handlePhotoMouseUp}
                          onTouchStart={() => handlePhotoTouchStart(feed.photo!, feed.title)}
                          onTouchEnd={handlePhotoTouchEnd}
                        />
                      )}
                      {feed.video && (
                        <video
                          src={feed.video}
                          controls
                          className="w-full h-40 md:h-48 object-cover rounded-xl border border-gray-200 shadow-sm"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {feedLoading && feeds.length > 0 && (
          [...Array(PAGE_SIZE)].map((_, i) => <FeedSkeleton key={`skel-${i}`} />)
        )}
      </div>
      {/* Photo Modal */}
      {showPhotoModal && modalPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900 bg-opacity-70"
          onClick={closeModal}
        >
          <div className="relative">
            <img
              src={modalPhotoUrl}
              alt={modalPhotoAlt}
              className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl border-8 border-white"
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-2 right-2 bg-white text-gray-800 p-2 rounded-full shadow hover:bg-gray-100"
              onClick={closeModal}
              aria-label="Close"
            >
              &#10005;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for blinking ring class
function getRingClass(status?: string) {
  if (!status) return "";
  const lower = status.toLowerCase();
  if (lower.includes("open to work") || status.includes("✅"))
    return "border-4 border-green-400 animate-pulse";
  if (lower.includes("not available") || status.includes("🛑"))
    return "border-4 border-red-400 animate-pulse";
  return "";
}