"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Globe, Phone, Image as ImageIcon, MessageCircle } from "lucide-react";

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
}

interface FeedUser {
  _id: string;
  username: string;
  profilePic?: string;
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

function FeedSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-stretch p-6 min-h-[240px] animate-pulse mb-4">
      <div className="flex flex-col items-center md:items-start mr-0 md:mr-8 min-w-[100px] mb-4 md:mb-0">
        <div className="w-16 h-16 rounded-full bg-gray-200 mb-2" />
        <div className="w-20 h-4 rounded bg-gray-200 mb-2" />
        <div className="w-12 h-3 rounded bg-gray-200" />
      </div>
      <div className="flex-1 flex flex-col md:flex-row gap-0 md:gap-8">
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
        <div className="flex flex-col gap-2 items-center justify-center md:justify-start md:items-start min-w-[220px] max-w-[220px]">
          <div className="w-[220px] h-[160px] bg-gray-200 rounded-xl" />
          <div className="w-[220px] h-[20px] bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, userId]);

  // --- Modal helpers ---
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

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-2">
      {/* Back Button */}
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center">
        <button
          onClick={() => setCurrentView("home")}
          className="flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors px-4 py-2 rounded-lg hover:bg-green-100"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
      </div>
      {/* PROFILE CARD */}
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden mb-10">
        {profileLoading ? (
          <div className="p-10 flex flex-col items-center">
            <FeedSkeleton />
          </div>
        ) : profileError || !profile ? (
          <div className="p-10 text-center">
            <p className="text-lg text-red-700 font-semibold mb-4">{profileError || "No profile data found."}</p>
            <button
              onClick={() => setCurrentView("home")}
              className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <>
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
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden">
                  {profile.profilePic ? (
                    <img src={profile.profilePic} alt="Profile" className="object-cover w-full h-full" />
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
                    {profile.serviceType === "posting" ? "💼 Service Provider" : "🔍 Looking for Services"}
                  </span>
                  {profile.serviceType === "posting" && profile.phone && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm flex items-center">
                      <Phone size={14} className="mr-1" />
                      {profile.phone}
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
          </>
        )}
      </div>
      {/* FEEDS LIST */}
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden p-8">
        <h3 className="text-2xl font-bold text-green-700 mb-6 text-center">
          {profile?.username ? `Posts by ${profile.username}` : "Posts"}
        </h3>
        {feeds.length === 0 && feedLoading ? (
          [...Array(PAGE_SIZE)].map((_, i) => <FeedSkeleton key={i} />)
        ) : feeds.length === 0 ? (
          <div className="text-center text-gray-500">No posts yet.</div>
        ) : (
          feeds.map(feed => (
            <div
              key={feed._id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-stretch p-6 transition hover:shadow-xl mb-6"
              style={{ minHeight: "240px" }}
            >
              {/* Profile pic and username, top left */}
              <div
                className="flex flex-col items-center md:items-start mr-0 md:mr-8 min-w-[100px] mb-4 md:mb-0 cursor-pointer hover:bg-gray-100 rounded-xl transition"
                title={`View ${feed.user.username}'s profile`}
              >
                {feed.user.profilePic ? (
                  <img
                    src={feed.user.profilePic}
                    alt={feed.user.username}
                    className="w-16 h-16 rounded-full object-cover border border-gray-300 mb-2"
                  />
                ) : (
                  <div
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-2xl border border-gray-300 mb-2"
                    aria-label={feed.user.username}
                  >
                    {feed.user.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="text-green-700 font-semibold text-sm text-center">{feed.user.username}</div>
                <div className="text-xs text-gray-400 mt-1">{timeAgo(feed.createdAt)}</div>
              </div>
              {/* Post details and media */}
              <div className="flex-1 flex flex-col md:flex-row gap-0 md:gap-8">
                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xl font-bold text-gray-900">{feed.title}</div>
                    </div>
                    <div className="mb-2">
                      <span className="inline-block font-semibold text-gray-700 w-20">Location:</span>
                      <span className="text-gray-800">{feed.location}</span>
                    </div>
                    <div className="mb-2">
                      <span className="inline-block font-semibold text-gray-700 w-20">Contact:</span>
                      <span className="text-gray-800">{feed.contactNumber}</span>
                    </div>
                    <div className="mb-2">
                      <span className="inline-block font-semibold text-gray-700 w-20">Price:</span>
                      <span className="text-gray-800">{feed.price} {feed.priceCurrency} ({feed.priceType})</span>
                    </div>
                    {feed.websiteLink && (
                      <div className="mb-2">
                        <span className="inline-block font-semibold text-gray-700 w-20">Website:</span>
                        <a
                          href={feed.websiteLink}
                          className="text-green-700 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {feed.websiteLink.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {feed.description && (
                      <div className="mb-2">
                        <span className="inline-block font-semibold text-gray-700 w-20">About:</span>
                        <span className="text-gray-700">{feed.description}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Media */}
                {(feed.photo || feed.video) && (
                  <div className="flex flex-col gap-2 items-center justify-center md:justify-start md:items-start min-w-[220px] max-w-[220px]">
                    {feed.photo && (
                      <img
                        src={feed.photo}
                        alt="Post Photo"
                        className="rounded-xl border object-cover"
                        style={{ width: "220px", height: "160px", background: "#f3f4f6" }}
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
                        className="rounded-xl border object-cover"
                        style={{ width: "220px", height: "160px", background: "#f3f4f6" }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {/* Loader Skeleton for infinite scroll */}
        {feedLoading && feeds.length > 0 && (
          [...Array(PAGE_SIZE)].map((_, i) => <FeedSkeleton key={`skel-${i}`} />)
        )}
      </div>
      {/* Photo Modal */}
      {showPhotoModal && modalPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
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