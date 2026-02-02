"use client";
import { useEffect, useState } from "react";
import { Star, CheckCircle } from "lucide-react";

// --- Interfaces ---
interface FeedUser {
  _id: string;
  username: string;
  profilePic?: string;
  status?: string; // <-- Add status for blinking ring
  isVerified?: boolean; // verification flag (may not be populated from backend)
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

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// --- Time Ago ---
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-row md:flex-row items-stretch p-4 md:p-8 min-h-[240px] animate-pulse">
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

// --- Edit State ---
type EditFeedState = {
  [key: string]: {
    title: string;
    location: string;
    price: number;
    priceType: string;
    priceCurrency: string;
    websiteLink: string;
    description: string;
  };
};

const PAGE_SIZE = 5;

// --- Helper: blinking ring class
const getRingClass = (status?: string) => {
  if (!status) return "";
  const lower = status.toLowerCase();
  if (lower.includes("open to work") || status.includes("✅"))
    return "border-4 border-green-400 animate-pulse";
  if (lower.includes("not available") || status.includes("🛑"))
    return "border-4 border-red-400 animate-pulse";
  return "";
};

// --- Main Component ---
export default function ProfileFeed() {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  const [modalPhotoAlt, setModalPhotoAlt] = useState<string>("");

  const [editFeed, setEditFeed] = useState<EditFeedState>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Success Modal State
  const [successModal, setSuccessModal] = useState<{ show: boolean, message: string }>({ show: false, message: "" });

  // Review stats cache: userId -> stats
  const [reviewStatsMap, setReviewStatsMap] = useState<Record<string, ReviewStats>>({});

  // Current user's profile info (to determine verified badge)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserIsVerified, setCurrentUserIsVerified] = useState(false);

  // Infinite scroll: fetch more when bottom comes into view
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 120) {
        setPage(p => p + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  // Fetch current user profile to determine verification status (uses same API as profile.tsx)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUserId(data.user._id || null);
          setCurrentUserIsVerified(!!data.user.isVerified);
        }
      } catch (err) {
        // ignore - not critical
        console.error("Failed to fetch current profile for verification status", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchMyFeeds(page);
  }, [page]);

  // Fetch review stats for the user (owner) on this profile
  useEffect(() => {
    // Get all unique userIds for the current feeds (should be the same user, but future-proof)
    const uniqueUserIds = new Set<string>();
    feeds.forEach(feed => {
      if (feed.user && feed.user._id && !(feed.user._id in reviewStatsMap)) {
        uniqueUserIds.add(feed.user._id);
      }
    });
    uniqueUserIds.forEach(async userId => {
      try {
        const res = await fetch(`${API_URL}/api/reviews/user/${userId}`);
        const data = await res.json();
        setReviewStatsMap(prev => ({
          ...prev,
          [userId]: {
            averageRating: typeof data.averageRating === "number" ? data.averageRating : 0,
            totalReviews: typeof data.totalReviews === "number" ? data.totalReviews : 0,
          },
        }));
      } catch (err) {
        // ignore individual failures
        console.error("Failed to fetch review stats for user", userId, err);
      }
    });
  }, [feeds]);

  async function fetchMyFeeds(pageNum: number) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/feed/my-paginated?page=${pageNum}&limit=${PAGE_SIZE}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (Array.isArray(data.feeds)) {
        setFeeds(prev => {
          const ids = new Set(prev.map(f => f._id));
          return [...prev, ...data.feeds.filter((f: FeedItem) => !ids.has(f._id))];
        });
        setHasMore(pageNum < data.totalPages);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    }
    setLoading(false);
  }

  let photoPressTimer: NodeJS.Timeout | null = null;

  const handlePhotoMouseDown = (photoUrl: string, alt: string) => {
    photoPressTimer = setTimeout(() => {
      setModalPhotoUrl(photoUrl);
      setModalPhotoAlt(alt);
      setShowPhotoModal(true);
    }, 500);
  };

  const handlePhotoMouseUp = () => {
    if (photoPressTimer) clearTimeout(photoPressTimer);
    photoPressTimer = null;
  };

  const handlePhotoTouchStart = (photoUrl: string, alt: string) => {
    photoPressTimer = setTimeout(() => {
      setModalPhotoUrl(photoUrl);
      setModalPhotoAlt(alt);
      setShowPhotoModal(true);
    }, 500);
  };

  const handlePhotoTouchEnd = () => {
    if (photoPressTimer) clearTimeout(photoPressTimer);
    photoPressTimer = null;
  };

  const closeModal = () => {
    setShowPhotoModal(false);
    setModalPhotoUrl(null);
    setModalPhotoAlt("");
  };

  const handleDelete = async (feedId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${API_URL}/api/feed/${feedId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setFeeds(prev => prev.filter(f => f._id !== feedId));
        setSuccessModal({ show: true, message: "Post deleted successfully!" });
      }
    } catch {
      alert("Failed to delete post.");
    }
  };

  const startEditing = (feed: FeedItem) => {
    setEditingId(feed._id);
    setEditFeed({
      [feed._id]: {
        title: feed.title,
        location: feed.location,
        price: feed.price,
        priceType: feed.priceType,
        priceCurrency: feed.priceCurrency ?? "",
        websiteLink: feed.websiteLink ?? "",
        description: feed.description ?? "",
      },
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFeed({});
  };

  const handleEditChange = (feedId: string, field: string, value: string | number) => {
    setEditFeed(prev => ({
      ...prev,
      [feedId]: {
        ...prev[feedId],
        [field]: value,
      },
    }));
  };

  const saveEdit = async (feedId: string) => {
    setEditLoading(true);
    const changes = editFeed[feedId];
    try {
      const res = await fetch(`${API_URL}/api/feed/${feedId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (res.ok) {
        const data = await res.json();
        setFeeds(prev => prev.map(f => f._id === feedId ? data.feed : f));
        cancelEditing();
        setSuccessModal({ show: true, message: "Post updated successfully!" });
      } else {
        alert("Failed to update post.");
      }
    } catch {
      alert("Failed to update post.");
    }
    setEditLoading(false);
  };

  const closeSuccessModal = () => setSuccessModal({ show: false, message: "" });

  return (
    <div className="w-full min-h-screen bg-green-50">
      <div className="w-full space-y-8 my-10">
        <h2 className="text-3xl font-bold text-green-800 mb-8 text-center">Your Posts</h2>
        {feeds.length === 0 && loading ? (
          <>
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <FeedSkeleton key={i} />
            ))}
          </>
        ) : feeds.length === 0 ? (
          <div className="text-center text-gray-500">You have not posted anything yet.</div>
        ) : (
          feeds.map(feed => {
            const ringClass = getRingClass(feed.user.status);
            const stats = feed.user && feed.user._id ? reviewStatsMap[feed.user._id] : undefined;

            // Determine verified badge: prefer populated isVerified if present,
            // otherwise if this feed belongs to the current user use currentUserIsVerified
            const showVerified =
              !!feed.user.isVerified || (currentUserId !== null && feed.user._id === currentUserId && currentUserIsVerified);

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
                    title={`Your profile`}
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
                        {showVerified && (
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
                      {/* Rating */}
                      {stats && stats.totalReviews > 0 ? (
                        <div className="flex items-center gap-1 text-yellow-500 text-sm">
                          <Star size={14} className="text-yellow-400" fill="currentColor" />
                          <span className="font-medium text-gray-800">{stats.averageRating.toFixed(1)}</span>
                          <span className="text-gray-500 text-xs">
                            ({stats.totalReviews})
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">No reviews yet</div>
        )}
                      {/* Edit/Delete buttons */}
                      <div className="flex gap-3 mt-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          onClick={() => startEditing(feed)}
                        >Edit</button>
                        <button
                          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                          onClick={() => handleDelete(feed._id)}
                        >Delete</button>
                      </div>
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
                          <p className="text-gray-900 font-medium">{feed.contactNumber}</p>
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

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900 bg-opacity-60">
            <div className="bg-white rounded-2xl shadow-2xl border border-green-300 w-full max-w-md mx-auto relative flex flex-col"
              style={{
                maxHeight: "98vh",
                minWidth: "320px",
                width: "100%",
                margin: "0 auto",
                top: "unset",
                left: "unset"
              }}>
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl font-bold"
                onClick={cancelEditing}
                aria-label="Close"
              >&#10005;</button>
              <h3 className="text-2xl font-bold text-green-800 mb-3 text-center pt-8">Edit Your Post</h3>
              <div className="flex-1 overflow-y-auto px-8 pb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col">
                    <label className="font-bold text-gray-900 mb-1">Service Name</label>
                    <input
                      type="text"
                      className="border border-gray-300 px-4 py-2 rounded w-full text-black bg-white placeholder-gray-400"
                      value={editFeed[editingId]?.title}
                      onChange={e => handleEditChange(editingId, "title", e.target.value)}
                      placeholder="Service name"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-bold text-gray-900 mb-1">Location</label>
                    <input
                      type="text"
                      className="border border-gray-300 px-4 py-2 rounded w-full text-black bg-white placeholder-gray-400"
                      value={editFeed[editingId]?.location}
                      onChange={e => handleEditChange(editingId, "location", e.target.value)}
                      placeholder="Location"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-bold text-gray-900 mb-1">Price</label>
                    <div className="flex gap-2 w-full flex-wrap">
                      <input
                        type="number"
                        className="border border-gray-300 px-4 py-2 rounded w-full sm:w-1/3 text-black bg-white placeholder-gray-400"
                        value={editFeed[editingId]?.price}
                        onChange={e => handleEditChange(editingId, "price", Number(e.target.value))}
                        placeholder="Amount"
                      />
                      <input
                        type="text"
                        className="border border-gray-300 px-4 py-2 rounded w-full sm:w-1/3 text-black bg-white placeholder-gray-400"
                        value={editFeed[editingId]?.priceCurrency}
                        onChange={e => handleEditChange(editingId, "priceCurrency", e.target.value)}
                        placeholder="Currency"
                      />
                      <select
                        className="border border-gray-300 px-3 py-2 rounded w-full sm:w-1/3 text-black bg-white"
                        value={editFeed[editingId]?.priceType}
                        onChange={e => handleEditChange(editingId, "priceType", e.target.value)}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="specific task">Specific Task</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-bold text-gray-900 mb-1">Website</label>
                    <input
                      type="text"
                      className="border border-gray-300 px-4 py-2 rounded w-full text-black bg-white placeholder-gray-400"
                      value={editFeed[editingId]?.websiteLink}
                      onChange={e => handleEditChange(editingId, "websiteLink", e.target.value)}
                      placeholder="Website link (https://...)"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-bold text-gray-900 mb-1">About</label>
                    <textarea
                      className="border border-gray-300 px-4 py-2 rounded w-full text-black bg-white placeholder-gray-400 min-h-[80px]"
                      value={editFeed[editingId]?.description}
                      onChange={e => handleEditChange(editingId, "description", e.target.value)}
                      placeholder="Describe your service"
                    />
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white px-8 py-4 flex gap-4 justify-center border-t border-green-100">
                <button
                  className="px-8 py-2 bg-green-700 text-white rounded font-bold hover:bg-green-800 transition"
                  disabled={editLoading}
                  onClick={() => saveEdit(editingId)}
                >Save</button>
                <button
                  className="px-8 py-2 bg-gray-300 text-black rounded font-bold hover:bg-gray-400 transition"
                  disabled={editLoading}
                  onClick={cancelEditing}
                >Cancel</button>
              </div>
            </div>
          </div>
        )}
        {loading && feeds.length > 0 && (
          [...Array(PAGE_SIZE)].map((_, i) => <FeedSkeleton key={`skel-${i}`} />)
        )}
        {/* Success Modal */}
        {successModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900 bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg border border-green-400 px-8 py-6 flex flex-col items-center">
              <svg className="w-12 h-12 text-green-600 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 12l2 2 4-4" />
              </svg>
              <div className="text-green-700 text-lg font-bold mb-2">{successModal.message}</div>
              <button className="px-6 py-2 bg-green-700 text-white rounded font-bold hover:bg-green-800 transition mt-2" onClick={closeSuccessModal}>OK</button>
            </div>
          </div>
        )}
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
    </div>
  );
}
