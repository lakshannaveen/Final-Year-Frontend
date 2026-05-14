"use client";
import { useState, useEffect } from "react";


//components
import { AuthProvider, useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";

//normal pages
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
import Inbox from "../pages/Inbox";; 
import Verify from "../pages/Verify"; 
import Report from "../pages/Report";

// admin pages
import AdminLogin from "../admin/AdminLogin";
import AdminReport from "../admin/AdminReport";
import AdminDashboard from "../admin/AdminDashboard";
import AdminFeedback from "../admin/AdminFeedback";
import AdminUsers from "../admin/AdminUsers";
import AdminServices from "../admin/AdminServices";
import AdminContact from "../admin/AdminContact";
import AdminIDVerifications from "../admin/AdminIDVerifications";





function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("home");
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);

  // Load currentView from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setCurrentView(hash);
    }
  }, []);

  // Keep app state in sync with browser back/forward navigation.
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") || "home";
      setCurrentView((prev) => (prev === hash ? prev : hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update URL hash when currentView changes
  useEffect(() => {
    const nextHash = currentView === "home" ? "" : `#${currentView}`;
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [currentView]);

  // Save currentView to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("currentView", currentView);
  }, [currentView]);


  interface ChatRecipient {
    recipientId: string;
    recipientUsername: string;
    recipientProfilePic?: string;
  }
  const [chatRecipient, setChatRecipient] = useState<ChatRecipient | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  // SCROLL RESTORATION
  const [feedScrollPos, setFeedScrollPos] = useState(0);
  const saveScrollPosition = (pos: number) => setFeedScrollPos(pos);
  const getSavedScrollPosition = () => feedScrollPos;

  const handleSetCurrentView = (view: string) => {
    if (view === "home") {
      saveScrollPosition(window.scrollY);
    }
    setCurrentView(view);
  };

  // SCROLL TO TOP ON VIEW CHANGE
  useEffect(() => {
    if (currentView !== "home") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
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
            setCurrentView={handleSetCurrentView}
            onShowPublicProfile={handleShowPublicProfile}
            saveScrollPosition={saveScrollPosition}
            getSavedScrollPosition={getSavedScrollPosition}
            onToggleSidebar={() => setSidebarOpen(true)}
          />
        );
      case "register":
        return <Register setCurrentView={handleSetCurrentView} />;
      case "signin":
        return <SignIn setCurrentView={handleSetCurrentView} />;
      case "privacy":
        return <Privacy setCurrentView={handleSetCurrentView} />;
      case "terms":
        return <Terms setCurrentView={handleSetCurrentView} />;
      case "contact":
        return <Contact setCurrentView={handleSetCurrentView} />;
      case "feedback":
        return <Feedback setCurrentView={handleSetCurrentView} />;
      case "profile":
        return <Profile setCurrentView={handleSetCurrentView} />;
      case "post":
        return <PostService setCurrentView={handleSetCurrentView} onToggleSidebar={() => setSidebarOpen(true)} />;
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
                  handleSetCurrentView("message");
                } else if (view === "report" && navData?.postId) {
                  setReportPostId(navData.postId);
                  handleSetCurrentView("report");
                } else if (view === "home") {
                  handleSetCurrentView("home");
                }
              }}
            />
          );
        }
        handleSetCurrentView("home");
        return null;
      case "message":
        if (chatRecipient) {
          return (
            <Message
              setCurrentView={handleSetCurrentView}
              recipientId={chatRecipient.recipientId}
              recipientUsername={chatRecipient.recipientUsername}
              recipientProfilePic={chatRecipient.recipientProfilePic}
            />
          );
        }
        handleSetCurrentView("home");
        return null;
      case "inbox":
        return (
          <Inbox
            setCurrentView={handleSetCurrentView}
            onOpenChat={handleShowMessage}
            currentView={currentView}
            onToggleSidebar={() => setSidebarOpen(true)}
          />
        );
      case "adminlogin":
        return <AdminLogin setCurrentView={handleSetCurrentView} />;
      case "admindashboard":
        return <AdminDashboard setCurrentView={handleSetCurrentView} />;
      // new admin pages:
      case "adminreport":
        return <AdminReport setCurrentView={handleSetCurrentView} />;
      case "adminfeedback":
        return <AdminFeedback setCurrentView={handleSetCurrentView} />;
      case "adminusers":
        return <AdminUsers setCurrentView={handleSetCurrentView} />;
      case "adminservices":
        return <AdminServices setCurrentView={handleSetCurrentView} />;
      case "admincontact":
        return <AdminContact setCurrentView={handleSetCurrentView} />;
      case "adminidverifications":
        return <AdminIDVerifications setCurrentView={handleSetCurrentView} />;
      case "verify":
        return <Verify setCurrentView={handleSetCurrentView} />;
      case "report":
        return <Report setCurrentView={handleSetCurrentView} postId={reportPostId} />;
      default:
        handleSetCurrentView("home");
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
