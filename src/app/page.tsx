"use client";
import { useEffect, useState, useCallback } from "react";
import { AuthProvider } from "../components/AuthContext";
import Home from "../pages/Home";
import Register from "../pages/Register";
import SignIn from "../pages/Signin";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import Contact from "../pages/Contact";
import Feedback from "../pages/Feedback";
import Profile from "../pages/Profile";
import PostService from "../pages/Post";
import PublicProfile from "../pages/PublicProfile";
import Message from "../pages/Message";
import Inbox from "../pages/Inbox";

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

export default function Page() {
  const [currentView, setCurrentView] = useState("home");
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);
  const [chatRecipient, setChatRecipient] = useState<{ recipientId: string, recipientUsername: string, recipientProfilePic?: string } | null>(null);

  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [feedsLoading, setFeedsLoading] = useState<boolean>(true);

  // --- SCROLL RESTORATION ---
  const [feedScrollPos, setFeedScrollPos] = useState(0);
  const saveScrollPosition = (pos: number) => setFeedScrollPos(pos);
  const getSavedScrollPosition = () => feedScrollPos;

  const fetchFeeds = useCallback(async () => {
    setFeedsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/feed/all`);
      const data = await res.json();
      setFeeds(data.feeds || []);
    } catch {
      setFeeds([]);
    }
    setFeedsLoading(false);
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const handleShowPublicProfile = (userId: string) => {
    setPublicProfileId(userId);
    setCurrentView("publicprofile");
  };

  const handleShowMessage = (recipientId: string, recipientUsername: string, recipientProfilePic?: string) => {
    setChatRecipient({ recipientId, recipientUsername, recipientProfilePic });
    setCurrentView("message");
  };

  // Avoid infinite recursion: never call renderContent() inside itself.
  // Only call renderContent() ONCE at the top-level.
  const renderContent = (): React.ReactNode => {
    switch (currentView) {
      case "home":
        return (
          <Home
            setCurrentView={setCurrentView}
            onShowPublicProfile={handleShowPublicProfile}
            onShowMessage={handleShowMessage}
            feeds={feeds}
            loading={feedsLoading}
            saveScrollPosition={saveScrollPosition}
            getSavedScrollPosition={getSavedScrollPosition}
          />
        );
      case "register":
        return <Register setCurrentView={setCurrentView} />;
      case "signin":
        return <SignIn setCurrentView={setCurrentView} />;
      case "privacy":
        return <Privacy setCurrentView={setCurrentView} />;
      case "terms":
        return <Terms setCurrentView={setCurrentView} />;
      case "contact":
        return <Contact setCurrentView={setCurrentView} />;
      case "feedback":
        return <Feedback setCurrentView={setCurrentView} />;
      case "profile":
        return <Profile setCurrentView={setCurrentView} />;
      case "post":
        return <PostService setCurrentView={setCurrentView} />;
      case "publicprofile":
        // Only render PublicProfile if publicProfileId is set
        if (publicProfileId) {
          return (
            <PublicProfile
              userId={publicProfileId}
              setCurrentView={(view, navData) => {
                if (view === "message" && navData) {
                  setChatRecipient({
                    recipientId: navData.recipientId,
                    recipientUsername: navData.recipientUsername,
                  });
                  setCurrentView("message");
                } else if (view === "home") {
                  setCurrentView("home");
                }
              }}
            />
          );
        }
        // If id is missing, go back home
        setCurrentView("home");
        return null;
      case "message":
        if (chatRecipient) {
          return (
            <Message
              setCurrentView={setCurrentView}
              recipientId={chatRecipient.recipientId}
              recipientUsername={chatRecipient.recipientUsername}
              recipientProfilePic={chatRecipient.recipientProfilePic}
            />
          );
        }
        // If recipient info missing, go back home
        setCurrentView("home");
        return null;
      case "inbox":
        return (
          <Inbox
            setCurrentView={setCurrentView}
            onOpenChat={handleShowMessage}
            currentView={currentView}
          />
        );
      default:
        // Default: go to home if unknown view
        setCurrentView("home");
        return null;
    }
  };

  return (
    <AuthProvider>
      {renderContent()}
    </AuthProvider>
  );
}