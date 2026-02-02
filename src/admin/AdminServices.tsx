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
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-stretch p-8 transition hover:shadow-xl"
                  style={{ minHeight: "240px" }}
                >
                  {/* Left: avatar, username, meta */}
                  <div className="flex flex-col items-center md:items-start mr-0 md:mr-8 min-w-[120px] mb-4 md:mb-0">
                    <div className="relative w-16 h-16 mb-2 flex items-center justify-center">
                      {ringClass && (
                        <span className={`absolute -inset-1 rounded-full pointer-events-none z-0 ${ringClass}`} aria-hidden></span>
                      )}
                      {feed.user?.profilePic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={feed.user.profilePic}
                          alt={feed.user?.username}
                          className="w-16 h-16 rounded-full object-cover border border-gray-300 z-10 bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-2xl border border-gray-300 z-10">
                          {feed.user?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-blue-800 font-bold text-base text-center">{feed.user?.username || "Unknown"}</div>
                      {showVerified && (
                        <span
                          className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white shadow-sm"
                          title="Verified account"
                          aria-label="Verified account"
                        >
                          <CheckCircle size={12} className="text-white" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{timeAgo(feed.createdAt)}</div>

                    <div className="mt-2 flex flex-col items-center">
                      {stats && stats.totalReviews > 0 ? (
                        <div className="flex items-center gap-1 text-yellow-500 text-sm font-semibold">
                          <Star size={16} className="mr-1 text-yellow-400" />
                          <span className="text-gray-800">{stats.averageRating.toFixed(1)}</span>
                          <span className="text-gray-500">({stats.totalReviews})</span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-300 italic">No reviews</div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => confirmDeleteService(feed._id)}
                        className="text-red-600 hover:underline text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Center & Right: details + media */}
                  <div className="flex-1 flex flex-col md:flex-row gap-0 md:gap-8">
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-xl font-bold text-gray-900">{feed.title}</div>
                        </div>

                        <div className="mb-2">
                          <span className="inline-block font-bold text-gray-700 w-28">Location:</span>
                          <span className="text-gray-800">{feed.location}</span>
                        </div>

                        <div className="mb-2">
                          <span className="inline-block font-bold text-gray-700 w-28">Contact:</span>
                          <span className="text-gray-800">{feed.contactNumber || "-"}</span>
                        </div>

                        <div className="mb-2">
                          <span className="inline-block font-bold text-gray-700 w-28">Price:</span>
                          <span className="text-gray-800">{feed.price ?? "-"} {feed.priceCurrency ?? ""} ({feed.priceType ?? ""})</span>
                        </div>

                        {feed.websiteLink && (
                          <div className="mb-2">
                            <span className="inline-block font-bold text-gray-700 w-28">Website:</span>
                            <a
                              href={feed.websiteLink}
                              className="text-blue-600 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {feed.websiteLink.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}

                        {feed.description && (
                          <div className="mb-2">
                            <span className="inline-block font-bold text-gray-700 w-28">About:</span>
                            <span className="text-gray-700">{feed.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(feed.photo || feed.video) && (
                      <div className="flex flex-col gap-2 items-center justify-center md:justify-start md:items-start min-w-[220px] max-w-[220px]">
                        {feed.photo && (
                          // click-hold to preview like ProfileFeed
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={feed.photo}
                            alt={feed.title}
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