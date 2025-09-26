/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";

// --- Interfaces ---
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

  useEffect(() => {
    fetchMyFeeds(page);
  }, [page]);

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
    } catch (err) {
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
    } catch (err) {
      alert("Failed to update post.");
    }
    setEditLoading(false);
  };

  const closeSuccessModal = () => setSuccessModal({ show: false, message: "" });

  return (
    <div className="w-full min-h-screen bg-green-50">
      <div className="w-full max-w-3xl mx-auto space-y-8 my-10">
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
          feeds.map(feed => (
            <div
              key={feed._id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-stretch p-8 transition hover:shadow-xl"
              style={{ minHeight: "240px" }}
            >
              {/* Profile pic and username, top left */}
              <div
                className="flex flex-col items-center md:items-start mr-0 md:mr-8 min-w-[120px] mb-4 md:mb-0 cursor-pointer hover:bg-gray-100 rounded-xl transition"
                title={`Your profile`}
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
                <div className="text-green-700 font-bold text-base text-center">{feed.user.username}</div>
                <div className="text-xs text-gray-400 mt-1">{timeAgo(feed.createdAt)}</div>
                <div className="mt-4 flex gap-3">
                  <button
                    className="text-blue-600 hover:underline text-sm font-medium"
                    onClick={() => startEditing(feed)}
                  >Edit</button>
                  <button
                    className="text-red-600 hover:underline text-sm font-medium"
                    onClick={() => handleDelete(feed._id)}
                  >Delete</button>
                </div>
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
                      <span className="inline-block font-bold text-gray-700 w-28">Location:</span>
                      <span className="text-gray-800">{feed.location}</span>
                    </div>
                    <div className="mb-2">
                      <span className="inline-block font-bold text-gray-700 w-28">Contact:</span>
                      <span className="text-gray-800">{feed.contactNumber}</span>
                    </div>
                    <div className="mb-2">
                      <span className="inline-block font-bold text-gray-700 w-28">Price:</span>
                      <span className="text-gray-800">{feed.price} {feed.priceCurrency} ({feed.priceType})</span>
                    </div>
                    {feed.websiteLink && (
                      <div className="mb-2">
                        <span className="inline-block font-bold text-gray-700 w-28">Website:</span>
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
                        <span className="inline-block font-bold text-gray-700 w-28">About:</span>
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
              {/* Edit Modal */}
              {editingId === feed._id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
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
                            value={editFeed[feed._id]?.title}
                            onChange={e => handleEditChange(feed._id, "title", e.target.value)}
                            placeholder="Service name"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="font-bold text-gray-900 mb-1">Location</label>
                          <input
                            type="text"
                            className="border border-gray-300 px-4 py-2 rounded w-full text-black bg-white placeholder-gray-400"
                            value={editFeed[feed._id]?.location}
                            onChange={e => handleEditChange(feed._id, "location", e.target.value)}
                            placeholder="Location"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="font-bold text-gray-900 mb-1">Price</label>
                          <div className="flex gap-2 w-full flex-wrap">
                            <input
                              type="number"
                              className="border border-gray-300 px-4 py-2 rounded w-full sm:w-1/3 text-black bg-white placeholder-gray-400"
                              value={editFeed[feed._id]?.price}
                              onChange={e => handleEditChange(feed._id, "price", Number(e.target.value))}
                              placeholder="Amount"
                            />
                            <input
                              type="text"
                              className="border border-gray-300 px-4 py-2 rounded w-full sm:w-1/3 text-black bg-white placeholder-gray-400"
                              value={editFeed[feed._id]?.priceCurrency}
                              onChange={e => handleEditChange(feed._id, "priceCurrency", e.target.value)}
                              placeholder="Currency"
                            />
                            <select
                              className="border border-gray-300 px-3 py-2 rounded w-full sm:w-1/3 text-black bg-white"
                              value={editFeed[feed._id]?.priceType}
                              onChange={e => handleEditChange(feed._id, "priceType", e.target.value)}
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
                            value={editFeed[feed._id]?.websiteLink}
                            onChange={e => handleEditChange(feed._id, "websiteLink", e.target.value)}
                            placeholder="Website link (https://...)"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="font-bold text-gray-900 mb-1">About</label>
                          <textarea
                            className="border border-gray-300 px-4 py-2 rounded w-full text-black bg-white placeholder-gray-400 min-h-[80px]"
                            value={editFeed[feed._id]?.description}
                            onChange={e => handleEditChange(feed._id, "description", e.target.value)}
                            placeholder="Describe your service"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="sticky bottom-0 bg-white px-8 py-4 flex gap-4 justify-center border-t border-green-100">
                      <button
                        className="px-8 py-2 bg-green-700 text-white rounded font-bold hover:bg-green-800 transition"
                        disabled={editLoading}
                        onClick={() => saveEdit(feed._id)}
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
            </div>
          ))
        )}
        {/* Skeleton loading for infinite scroll */}
        {loading && feeds.length > 0 && (
          [...Array(PAGE_SIZE)].map((_, i) => <FeedSkeleton key={`skel-${i}`} />)
        )}
        {/* Success Modal */}
        {successModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
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
    </div>
  );
}