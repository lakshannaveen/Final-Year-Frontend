"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface HomeProps {
  setCurrentView: (view: string) => void;
  onShowPublicProfile: (userId: string) => void;
  onShowMessage: (recipientId: string, recipientUsername: string, postId: string) => void;
  feeds: FeedItem[];
  loading: boolean;
  saveScrollPosition: (pos: number) => void;
  getSavedScrollPosition: () => number;
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

// Facebook-style time ago formatting
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

// Skeleton loader for feed card
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

export default function Home({
  setCurrentView,
  onShowPublicProfile,
  onShowMessage,
  feeds,
  loading,
  saveScrollPosition,
  getSavedScrollPosition,
}: HomeProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  const [modalPhotoAlt, setModalPhotoAlt] = useState<string>("");

  // Restore scroll position on mount
  useEffect(() => {
    const pos = getSavedScrollPosition();
    // Wait for rendering
    setTimeout(() => {
      window.scrollTo(0, pos);
    }, 0);
  }, [getSavedScrollPosition]);

  // Save scroll position before navigating away
  const handleNavigate = (navFn: () => void) => {
    saveScrollPosition(window.scrollY);
    navFn();
  };

  // Long press handler for photo
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar currentView="home" setCurrentView={setCurrentView} />
      <section className="flex flex-col flex-grow items-center px-4 py-6">
        <div className="w-full max-w-3xl space-y-8">
          {loading ? (
            [...Array(3)].map((_, i) => <FeedSkeleton key={i} />)
          ) : feeds.length === 0 ? (
            <div className="text-center text-gray-500">No posts yet.</div>
          ) : (
            feeds.map(feed => (
              <div
                key={feed._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-stretch p-6 transition hover:shadow-xl"
                style={{ minHeight: "240px" }}
              >
                {/* Profile pic and username, top left */}
                <div
                  className="flex flex-col items-center md:items-start mr-0 md:mr-8 min-w-[100px] mb-4 md:mb-0 cursor-pointer hover:bg-gray-100 rounded-xl transition"
                  onClick={() => handleNavigate(() => onShowPublicProfile(feed.user._id))}
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
                        {/* Message icon */}
                        <button
                          className="ml-2 px-2 py-1 rounded-full bg-gray-100 hover:bg-green-100 transition border border-green-200"
                          title="Message"
                          aria-label="Message"
                          onClick={() => handleNavigate(() =>
                            onShowMessage(feed.user._id, feed.user.username, feed._id)
                          )}
                        >
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                            <path d="M21 15.46V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14l4-4h10a2 2 0 0 0 2-2z"
                              stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              fill="none"/>
                          </svg>
                        </button>
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
      </section>
      <Footer setCurrentView={setCurrentView} />
    </div>
  );
}