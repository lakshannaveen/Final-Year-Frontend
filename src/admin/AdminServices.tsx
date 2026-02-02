"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { RefreshCw, Trash2, Star, CheckCircle } from "lucide-react";

type Props = {
  setCurrentView: (view: string) => void;
};

interface FeedUser {
  _id: string;
  username?: string;
  profilePic?: string;
  status?: string;
  serviceType?: string;
  isVerified?: boolean;
}

interface FeedItem {
  _id: string;
  user: FeedUser;
  title: string;
  location: string;
  contactNumber?: string;
  price?: number;
  priceType?: string;
  priceCurrency?: string;
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
const PAGE_SIZE = 10;

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

// --- Feed skeleton (matching ProfileFeed style) ---
function FeedSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-stretch p-6 min-h-[240px] animate-pulse">
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

// --- Helper: blinking ring class (same logic as ProfileFeed) ---
const getRingClass = (status?: string) => {
  if (!status) return "";
  const lower = status.toLowerCase();
  if (lower.includes("open to work") || status.includes("✅"))
    return "border-4 border-green-400 animate-pulse";
  if (lower.includes("not available") || status.includes("🛑"))
    return "border-4 border-red-400 animate-pulse";
  return "";
};

export default function AdminServices({ setCurrentView }: Props) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  // Current user verification status
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserIsVerified, setCurrentUserIsVerified] = useState(false);

  // Analytics for verified vs non-verified posts
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [nonVerifiedCount, setNonVerifiedCount] = useState(0);

  // Review stats cache per user id (optional UI element shown next to avatar)
  const [reviewStatsMap, setReviewStatsMap] = useState<Record<string, ReviewStats>>({});

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchServices = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/manage/services?page=${pageNum}&limit=${PAGE_SIZE}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch services: ${res.status}`);
      }
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
    } catch (err) {
      console.error("Fetch services error:", err);
      setHasMore(false);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // fetch review stats for users in feeds (optional)
  useEffect(() => {
    const uniq = new Set<string>();
    feeds.forEach(f => {
      if (f.user && f.user._id && !(f.user._id in reviewStatsMap)) uniq.add(f.user._id);
    });
    if (uniq.size === 0) return;
    uniq.forEach(async userId => {
      try {
        const res = await fetch(`${API_URL}/api/reviews/user/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        setReviewStatsMap(prev => ({
          ...prev,
          [userId]: {
            averageRating: typeof data.averageRating === "number" ? data.averageRating : 0,
            totalReviews: typeof data.totalReviews === "number" ? data.totalReviews : 0,
          },
        }));
      } catch {
        // ignore
      }
    });
  }, [feeds, reviewStatsMap]);

  // Fetch current user verification status
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
    fetchServices(page);
  }, [page, fetchServices]);

  useEffect(() => {
    const onScroll = () => {
      if (loading || !hasMore) return;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      const scrollHeight = document.documentElement.scrollHeight;
      if (scrollTop + clientHeight >= scrollHeight - 120) {
        setPage(p => p + 1);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, hasMore]);

  // Calculate verified vs non-verified post analytics
  useEffect(() => {
    let verified = 0;
    let nonVerified = 0;

    feeds.forEach(feed => {
      const isVerified = !!feed.user.isVerified || (currentUserId !== null && feed.user._id === currentUserId && currentUserIsVerified);
      if (isVerified) {
        verified++;
      } else {
        nonVerified++;
      }
    });

    setVerifiedCount(verified);
    setNonVerifiedCount(nonVerified);
  }, [feeds, currentUserId, currentUserIsVerified]);

  // Photo modal + long-press support (matching ProfileFeed)
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  const [modalPhotoAlt, setModalPhotoAlt] = useState<string>("");
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
  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setModalPhotoUrl(null);
    setModalPhotoAlt("");
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setFeeds([]);
      setPage(1);
      await fetchServices(1);
      setSuccess({ show: true, message: "Refreshed" });
      setTimeout(() => setSuccess({ show: false, message: "" }), 2500);
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteService = (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    performDelete(id);
  };

  const performDelete = async (id: string) => {
    try {
      setDeleting(id);
      const res = await fetch(`${API_URL}/api/admin/manage/services/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.errors?.server || `Failed to delete service: ${res.status}`);
      }
      setFeeds(prev => prev.filter(f => f._id !== id));
      setSuccess({ show: true, message: "Service deleted successfully." });
      setTimeout(() => setSuccess({ show: false, message: "" }), 3500);
    } catch (err) {
      console.error("Delete action failed:", err);
      alert("Delete action failed.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView("admindashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              title="Back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-blue-900">Admin - Manage Services</h1>
          </div>

          <div className="flex flex-col items-end">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            {/* optional short success text shown after refresh */}
            {success.show && (
              <div className="mt-2 text-green-700 text-sm font-semibold bg-green-50 px-2 py-1 rounded">
                {success.message}
              </div>
            )}
          </div>
        </header>

        {/* Analytics Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Services Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">{verifiedCount}</div>
                  <div className="text-sm text-blue-600">Verified Posts</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-700">{nonVerifiedCount}</div>
                  <div className="text-sm text-gray-600">Non-Verified Posts</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="text-white font-bold text-sm">{verifiedCount + nonVerifiedCount}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{verifiedCount + nonVerifiedCount}</div>
                  <div className="text-sm text-green-600">Total Posts</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {feeds.length === 0 && loading ? (
            <>
              {[...Array(4)].map((_, idx) => (
                <FeedSkeleton key={idx} />
              ))}
            </>
          ) : feeds.length === 0 ? (
            <div className="text-center text-gray-500">No services found.</div>
          ) : (
            feeds.map(feed => {
              const ringClass = getRingClass(feed.user?.status);
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
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {/* Blinking ring - OUTSIDE profile pic */}
                        {ringClass && (
                          <span
                            className={`absolute -inset-1 rounded-full pointer-events-none z-0 ${ringClass}`}
                            aria-hidden
                          ></span>
                        )}
                        {feed.user?.profilePic ? (
                          <img
                            src={feed.user.profilePic}
                            alt={feed.user?.username}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 z-10 bg-white"
                          />
                        ) : (
                          <div
                            className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-xl border-2 border-gray-200 z-10"
                            aria-label={feed.user?.username}
                          >
                            {feed.user?.username?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 text-base">{feed.user?.username || "Unknown"}</span>
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
                        {/* Delete button */}
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => confirmDeleteService(feed._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
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
                            <p className="text-gray-900 font-medium">{feed.contactNumber || "Not provided"}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
                            💰
                          </span>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Price</span>
                            <p className="text-gray-900 font-medium">{feed.price ?? "Not set"} {feed.priceCurrency ?? ""} <span className="text-sm text-gray-600">({feed.priceType ?? ""})</span></p>
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
        </div>

        {/* skeletons for additional loading */}
        {loading && feeds.length > 0 && (
          [...Array(2)].map((_, i) => <FeedSkeleton key={`skel-${i}`} />)
        )}

        {/* Photo Modal */}
        {showPhotoModal && modalPhotoUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900 bg-opacity-70"
            onClick={closePhotoModal}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={modalPhotoUrl}
                alt={modalPhotoAlt}
                className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl border-8 border-white"
                onClick={e => e.stopPropagation()}
              />
              <button
                className="absolute top-2 right-2 bg-white text-gray-800 p-2 rounded-full shadow hover:bg-gray-100"
                onClick={closePhotoModal}
                aria-label="Close"
              >
                &#10005;
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {feeds.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => { if (page > 1) setPage(page - 1); }}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-green-50 disabled:opacity-80 disabled:cursor-not-allowed text-blue-700"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-blue-700">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 text-blue-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}