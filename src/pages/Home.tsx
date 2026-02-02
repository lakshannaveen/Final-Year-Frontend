"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Search from "../components/Search";
import { Star, CheckCircle } from "lucide-react";

interface HomeProps {
  setCurrentView: (view: string) => void;
  onShowPublicProfile: (userId: string) => void;
  saveScrollPosition: (pos: number) => void;
  getSavedScrollPosition: () => number;
  onToggleSidebar?: () => void;
}

interface FeedUser {
  _id: string;
  username: string;
  profilePic?: string;
  status?: string;
  isVerified?: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-row md:flex-row items-stretch p-4 md:p-6 min-h-[240px] animate-pulse">
      {/* Left side: Profile and media skeleton */}
      <div className="flex flex-col items-center md:items-start mr-4 md:mr-8 min-w-[120px] md:min-w-[100px]">
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

const PAGE_SIZE = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home({
  setCurrentView,
  onShowPublicProfile,
  saveScrollPosition,
  getSavedScrollPosition,
  onToggleSidebar,
}: HomeProps) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  const [modalPhotoAlt, setModalPhotoAlt] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FeedItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Review stats cache: userId -> stats
  const [reviewStatsMap, setReviewStatsMap] = useState<Record<string, ReviewStats>>({});

  // Verification status cache: userId -> isVerified
  const [verificationMap, setVerificationMap] = useState<Record<string, boolean>>({});

  // Fetch review stats for users in current feeds
  useEffect(() => {
    const usersToFetch = new Set<string>();
    const displayFeeds = searchTerm ? (searchResults || []) : feeds;
    displayFeeds.forEach(feed => {
      if (feed.user && feed.user._id && !(feed.user._id in reviewStatsMap)) {
        usersToFetch.add(feed.user._id);
      }
    });
    if (usersToFetch.size === 0) return;
    usersToFetch.forEach(async userId => {
      const res = await fetch(`${API_URL}/api/reviews/user/${userId}`);
      const data = await res.json();
      setReviewStatsMap(prev => ({
        ...prev,
        [userId]: {
          averageRating: typeof data.averageRating === "number" ? data.averageRating : 0,
          totalReviews: typeof data.totalReviews === "number" ? data.totalReviews : 0,
        }
      }));
    });
  }, [feeds, searchResults, searchTerm]);

  // Fetch verification status for users in current feeds
  useEffect(() => {
    const usersToFetch = new Set<string>();
    const displayFeeds = searchTerm ? (searchResults || []) : feeds;
    displayFeeds.forEach(feed => {
      if (feed.user && feed.user._id && !(feed.user._id in verificationMap)) {
        usersToFetch.add(feed.user._id);
      }
    });
    if (usersToFetch.size === 0) return;
    usersToFetch.forEach(async userId => {
      try {
        const res = await fetch(`${API_URL}/api/profile/public/${userId}`);
        const data = await res.json();
        if (data.user && typeof data.user.isVerified === 'boolean') {
          setVerificationMap(prev => ({
            ...prev,
            [userId]: data.user.isVerified
          }));
        }
      } catch (err) {
        console.error("Failed to fetch verification status for user", userId, err);
      }
    });
  }, [feeds, searchResults, searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      if (scrollTop + clientHeight >= scrollHeight - 120) {
        setPage((p) => p + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  useEffect(() => {
    if (searchTerm) return;
    const fetchFeeds = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/feed/paginated?page=${page}&limit=${PAGE_SIZE}`
        );
        const data = await res.json();
        if (Array.isArray(data.feeds)) {
          setFeeds((prev) => {
            const ids = new Set(prev.map((f) => f._id));
            return [...prev, ...data.feeds.filter((f: FeedItem) => !ids.has(f._id))];
          });
          setHasMore(page < data.totalPages);
        }
      } catch {
        setHasMore(false);
      }
      setLoading(false);
    };
    fetchFeeds();
  }, [page, searchTerm]);

  useEffect(() => {
    const pos = getSavedScrollPosition();
    setTimeout(() => {
      window.scrollTo(0, pos);
    }, 0);
  }, [getSavedScrollPosition]);

  const handleNavigate = (navFn: () => void) => {
    saveScrollPosition(window.scrollY);
    navFn();
  };

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

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/feeds/search?query=${encodeURIComponent(term)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let data: { feeds?: FeedItem[]; searchType?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const errorMsg = data && data.error ? data.error : "Search failed";
        throw new Error(errorMsg);
      }

      setSearchResults(Array.isArray(data.feeds) ? data.feeds : []);
    } catch (_err) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Only profile picture circle gets blinking ring OUTSIDE profile pic
  const getRingClass = (status?: string) => {
    if (!status) return "";
    const lower = status.toLowerCase();
    if (lower.includes("open to work") || status.includes("✅"))
      return "border-4 border-green-400 animate-pulse";
    if (lower.includes("not available") || status.includes("🛑"))
      return "border-4 border-red-400 animate-pulse";
    return "";
  };

  const displayFeeds = searchTerm ? searchResults || [] : feeds;
  const displayLoading = searchTerm ? searchLoading : loading;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        currentView="home"
        setCurrentView={setCurrentView}
        onShowPublicProfile={onShowPublicProfile}
        onToggleSidebar={onToggleSidebar}
      />

      <div className="w-full mt-6 mb-4 px-2 md:px-4">
        <Search
          value={searchTerm}
          onChange={handleSearch}
          loading={searchLoading}
          onShowPublicProfile={onShowPublicProfile}
        />
      </div>

      <section className="flex flex-col flex-grow items-center px-4 py-6">
        <div className="w-full space-y-8">
          {displayFeeds.length === 0 && displayLoading ? (
            [...Array(PAGE_SIZE)].map((_, i) => <FeedSkeleton key={i} />)
          ) : displayFeeds.length === 0 ? (
            <div className="text-center text-gray-500">No posts yet.</div>
          ) : (
            displayFeeds.map((feed) => {
              const ringClass = getRingClass(feed.user.status);
              const stats = feed.user && feed.user._id ? reviewStatsMap[feed.user._id] : undefined;
              const isVerified = feed.user && feed.user._id ? verificationMap[feed.user._id] : false;
              return (
                <div
                  key={feed._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col md:flex-row"
                  style={{ minHeight: "280px" }}
                >
                  {/* Header with profile and basic info */}
                  <div className="flex items-center p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100">
                    <div
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors"
                      onClick={() => handleNavigate(() => onShowPublicProfile(feed.user._id))}
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
                          {isVerified && (
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
          {displayLoading && displayFeeds.length > 0 && (
            [...Array(PAGE_SIZE)].map((_, i) => <FeedSkeleton key={`skel-${i}`} />)
          )}
        </div>
        {showPhotoModal && modalPhotoUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900 bg-opacity-70"
            onClick={closeModal}
          >
            <div className="relative">
              <img
                src={modalPhotoUrl}
                alt={modalPhotoAlt}
                width={800}
                height={600}
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
      </section>
    </div>
  );
}