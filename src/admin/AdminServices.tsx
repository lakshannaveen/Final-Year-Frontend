"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";

type Props = {
  setCurrentView: (view: string) => void;
};

interface FeedUser {
  _id: string;
  username: string;
  profilePic?: string;
  status?: string;
  serviceType?: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAGE_SIZE = 10;

function timeAgo(dateString: string) {
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
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function FeedSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex items-stretch p-6 min-h-[140px] animate-pulse">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      </div>
      <div className="w-[160px] h-[100px] bg-gray-200 rounded-xl ml-6" />
    </div>
  );
}

export default function AdminServices({ setCurrentView }: Props) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const [showBackText, setShowBackText] = useState(false);

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

  const handleRefresh = async () => {
    try {
      setLoading(true);
      // reset list and fetch first page
      setFeeds([]);
      setPage(1);
      await fetchServices(1);
      setShowBackText(true);
      setTimeout(() => setShowBackText(false), 5000);
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

  const closeSuccess = () => setSuccess({ show: false, message: "" });

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView("admindashboard")}
              aria-label="Go back"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-blue-200 hover:bg-blue-50 transition"
              title="Back"
            >
              <ArrowLeft size={20} color="#0ea5e9" />
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

            {showBackText && (
              <button
                onClick={() => setCurrentView("admindashboard")}
                className="mt-2 text-green-700 hover:text-green-800 text-sm font-semibold bg-green-50 px-2 py-1 rounded transition cursor-pointer"
                title="Back to Dashboard"
              >
                Back to Dashboard
              </button>
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
            feeds.map(feed => (
              <div
                key={feed._id}
                className="bg-white rounded-2xl shadow border border-gray-200 p-6 flex flex-col md:flex-row gap-6 transition hover:shadow-lg"
              >
                <div className="flex items-start gap-4 min-w-[220px]">
                  <div className="relative">
                    {feed.user?.profilePic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={feed.user.profilePic}
                        alt={feed.user.username}
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl border">
                        {feed.user?.username?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-blue-800">{feed.user?.username}</div>
                    <div className="text-xs text-gray-400">{timeAgo(feed.createdAt)}</div>
                    {feed.user?.status && (
                      <div className="text-xs mt-1 text-gray-600">{feed.user.status}</div>
                    )}
                    {feed.user?.serviceType && (
                      <div className="text-xs mt-1 text-gray-500 italic">{feed.user.serviceType}</div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{feed.title}</div>
                      <div className="text-sm text-gray-700">{feed.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{feed.price ?? "-" } {feed.priceCurrency ?? ""}</div>
                      <div className="text-xs text-gray-400">{feed.priceType ?? ""}</div>
                    </div>
                  </div>

                  {feed.description && (
                    <p className="mt-3 text-gray-700">{feed.description}</p>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    {feed.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={feed.photo} alt="photo" className="w-32 h-20 object-cover rounded border" />
                    )}
                    {feed.video && (
                      <video src={feed.video} className="w-32 h-20 object-cover rounded border" controls />
                    )}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => confirmDeleteService(feed._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                      disabled={deleting === feed._id}
                    >
                      <Trash2 size={16} />
                      {deleting === feed._id ? "Deleting..." : "Delete Service"}
                    </button>

                    {feed.websiteLink && (
                      <a
                        href={feed.websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-blue-600 underline"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && feeds.length > 0 && (
            <div>
              {[...Array(2)].map((_, i) => (
                <FeedSkeleton key={i} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {feeds.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => {
                if (page > 1) {
                  setPage(page - 1);
                }
              }}
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

      {/* Success modal */}
      {success.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm text-center">
            <div className="text-green-700 font-bold">{success.message}</div>
            <button
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
              onClick={closeSuccess}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}