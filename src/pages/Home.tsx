"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface HomeProps {
  setCurrentView: (view: string) => void;
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

export default function Home({ setCurrentView }: HomeProps) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeeds() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/feed/all`);
        const data = await res.json();
        setFeeds(data.feeds || []);
      } catch {
        setFeeds([]);
      }
      setLoading(false);
    }
    fetchFeeds();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar currentView="home" setCurrentView={setCurrentView} />

      <section className="flex flex-col flex-grow items-center px-4 py-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Welcome</h1>
        {loading ? (
          <div className="text-center text-gray-500">Loading posts...</div>
        ) : (
          <div className="w-full max-w-3xl space-y-6">
            {feeds.length === 0 ? (
              <div className="text-center text-gray-500">No posts yet.</div>
            ) : (
              feeds.map(feed => (
                <div key={feed._id} className="bg-white rounded-lg shadow p-6 flex">
                  {/* Profile pic and username, top left */}
                  <div className="flex flex-col items-center mr-6 min-w-[80px]">
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
                  </div>
                  {/* Post details */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="text-lg font-bold text-gray-900">{feed.title}</div>
                      <div className="text-sm text-gray-500">{new Date(feed.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-gray-800 mb-1">
                      <span className="font-semibold">Location:</span> {feed.location}
                    </div>
                    <div className="text-gray-800 mb-1">
                      <span className="font-semibold">Contact:</span> {feed.contactNumber}
                    </div>
                    <div className="text-gray-800 mb-1">
                      <span className="font-semibold">Price:</span> {feed.price} {feed.priceCurrency} ({feed.priceType})
                    </div>
                    {feed.websiteLink && (
                      <div className="mb-1">
                        <a
                          href={feed.websiteLink}
                          className="text-green-700 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    {feed.description && (
                      <div className="mb-2 text-gray-700">{feed.description}</div>
                    )}
                    {feed.photo && (
                      <img
                        src={feed.photo}
                        alt="Post Photo"
                        className="w-full max-w-sm rounded-lg border mt-2"
                      />
                    )}
                    {feed.video && (
                      <video
                        src={feed.video}
                        controls
                        className="w-full max-w-sm rounded-lg border mt-2"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <Footer setCurrentView={setCurrentView} />
    </div>
  );
}