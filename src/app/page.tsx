"use client";
import { useState } from "react";
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

// FIX: Remove onShowMessage from Home props if not used in Home.tsx

export default function Page() {
  const [currentView, setCurrentView] = useState("home");
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);
  const [chatRecipient, setChatRecipient] = useState<{ recipientId: string, recipientUsername: string, recipientProfilePic?: string } | null>(null);

  // --- SCROLL RESTORATION ---
  const [feedScrollPos, setFeedScrollPos] = useState(0);
  const saveScrollPosition = (pos: number) => setFeedScrollPos(pos);
  const getSavedScrollPosition = () => feedScrollPos;

  // Show public profile handler
  const handleShowPublicProfile = (userId: string) => {
    setPublicProfileId(userId);
    setCurrentView("publicprofile");
  };

  // Show message handler (used in Inbox, PublicProfile)
  const handleShowMessage = (recipientId: string, recipientUsername: string, recipientProfilePic?: string) => {
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
        return (
          <Inbox
            setCurrentView={setCurrentView}
            onOpenChat={handleShowMessage}
            currentView={currentView}
          />
        );
      default:
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