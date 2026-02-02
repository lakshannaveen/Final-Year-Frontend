"use client";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
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
import AdminLogin from "../admin/AdminLogin"; // Admin login component you added
import AdminDashboard from "../admin/AdminDashboard"; // Admin dashboard component
import Verify from "../pages/Verify"; 

// New admin pages
import AdminReport from "../admin/AdminReport";
import AdminFeedback from "../admin/AdminFeedback";
import AdminUsers from "../admin/AdminUsers";
import AdminServices from "../admin/AdminServices";
import AdminContact from "../admin/AdminContact";
import AdminIDVerifications from "../admin/AdminIDVerifications";



// FIX: Remove onShowMessage from Home props if not used in Home.tsx

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("home");
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);

  // FIX: Remove 'any'
  interface ChatRecipient {
    recipientId: string;
    recipientUsername: string;
    recipientProfilePic?: string;
  }
  const [chatRecipient, setChatRecipient] = useState<ChatRecipient | null>(null);

  // --- SCROLL RESTORATION ---
  const [feedScrollPos, setFeedScrollPos] = useState(0);
  const saveScrollPosition = (pos: number) => setFeedScrollPos(pos);
  const getSavedScrollPosition = () => feedScrollPos;

  // --- SCROLL TO TOP ON VIEW CHANGE ---
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentView]);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Touch gesture state
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50; // Minimum swipe distance
    
    if (isLeftSwipe && touchStartX < 50) { // Only trigger if started from left edge
      setSidebarOpen(true);
    }
  };

  // Only navigate IF user manually types the hidden URL
  useEffect(() => {
    try {
    
      const PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";
      const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "";

      // Require the exact query string to match one of the two canonical orders:
      // ?admin=<PUBLIC_KEY>&user=<ADMIN_USERNAME>
      // or ?user=<ADMIN_USERNAME>&admin=<PUBLIC_KEY>
      const exactA = `?admin=${encodeURIComponent(PUBLIC_KEY)}&user=${encodeURIComponent(ADMIN_USERNAME)}`;
      const exactB = `?user=${encodeURIComponent(ADMIN_USERNAME)}&admin=${encodeURIComponent(PUBLIC_KEY)}`;

      if (window.location.search === exactA || window.location.search === exactB) {
        // Only set admin view when both params exactly match the env values.
        setCurrentView("adminlogin");
      }
    } catch {
      // ignore URL parsing errors
    }
  }, []); // run only once on mount


  // Only navigate IF user manually types the hidden URL
  useEffect(() => {
    try {
    
      const PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";
      const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "";

      // Require the exact query string to match one of the two canonical orders:
      // ?admin=<PUBLIC_KEY>&user=<ADMIN_USERNAME>
      // or ?user=<ADMIN_USERNAME>&admin=<PUBLIC_KEY>
      const exactA = `?admin=${encodeURIComponent(PUBLIC_KEY)}&user=${encodeURIComponent(ADMIN_USERNAME)}`;
      const exactB = `?user=${encodeURIComponent(ADMIN_USERNAME)}&admin=${encodeURIComponent(PUBLIC_KEY)}`;

      if (window.location.search === exactA || window.location.search === exactB) {
        // Only set admin view when both params exactly match the env values.
        setCurrentView("adminlogin");
      }
    } catch {
      // ignore URL parsing errors
    }
  }, []); // run only once on mount

  // Show public profile handler
  const handleShowPublicProfile = (userId: string) => {
    setPublicProfileId(userId);
    setCurrentView("publicprofile");
  };

  // Show message handler (used in Inbox, PublicProfile)
  const handleShowMessage = (
    recipientId: string,
    recipientUsername: string,
    recipientProfilePic?: string
  ) => {
    setChatRecipient({
      recipientId,
      recipientUsername,
      recipientProfilePic,
    });
    setCurrentView("message");
  };

  const renderContent = (): React.ReactNode => {
    switch (currentView) {
      case "home":
        return (
          <Home
            setCurrentView={setCurrentView}
            onShowPublicProfile={handleShowPublicProfile}
            saveScrollPosition={saveScrollPosition}
            getSavedScrollPosition={getSavedScrollPosition}
            onToggleSidebar={() => setSidebarOpen(true)}
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
        return <PostService setCurrentView={setCurrentView} onToggleSidebar={() => setSidebarOpen(true)} />;
      case "publicprofile":
        if (publicProfileId) {
          return (
            <PublicProfile
              userId={publicProfileId}
              setCurrentView={(view, navData) => {
                if (view === "message" && navData) {
                  setChatRecipient({
                    recipientId: navData.recipientId ?? "",
                    recipientUsername: navData.recipientUsername ?? "",
                    recipientProfilePic: navData.recipientProfilePic ?? undefined,
                  });
                  setCurrentView("message");
                } else if (view === "home") {
                  setCurrentView("home");
                }
              }}
            />
          );
        }
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
        setCurrentView("home");
        return null;
      case "inbox":
        if (!user) {
          setCurrentView("signin");
          return null;
        }
        return (
          <Inbox
            setCurrentView={setCurrentView}
            onOpenChat={handleShowMessage}
            currentView={currentView}
            onToggleSidebar={() => setSidebarOpen(true)}
          />
        );
      case "adminlogin":
        return <AdminLogin setCurrentView={setCurrentView} />;
      case "admindashboard":
        return <AdminDashboard setCurrentView={setCurrentView} />;
      // new admin pages:
      case "adminreport":
        return <AdminReport setCurrentView={setCurrentView} />;
      case "adminfeedback":
        return <AdminFeedback setCurrentView={setCurrentView} />;
      case "adminusers":
        return <AdminUsers setCurrentView={setCurrentView} />;
      case "adminservices":
        return <AdminServices setCurrentView={setCurrentView} />;
      case "admincontact":
        return <AdminContact setCurrentView={setCurrentView} />;
      case "adminidverifications":
        return <AdminIDVerifications setCurrentView={setCurrentView} />;
      case "verify":
        return <Verify setCurrentView={setCurrentView} />;
      default:
        setCurrentView("home");
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {renderContent()}
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        setCurrentView={setCurrentView}
      />
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}