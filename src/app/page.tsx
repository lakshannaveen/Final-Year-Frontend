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

export default function Index() {
  const [currentView, setCurrentView] = useState("home");
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);

  const handleShowPublicProfile = (userId: string) => {
    setPublicProfileId(userId);
    setCurrentView("publicprofile");
  };

  const renderContent = () => {
    switch (currentView) {
      case "home":
        return <Home setCurrentView={setCurrentView} onShowPublicProfile={handleShowPublicProfile} />;
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
        return publicProfileId ? (
          <PublicProfile userId={publicProfileId} setCurrentView={setCurrentView} />
        ) : (
          <Home setCurrentView={setCurrentView} onShowPublicProfile={handleShowPublicProfile} />
        );
      default:
        return <Home setCurrentView={setCurrentView} onShowPublicProfile={handleShowPublicProfile} />;
    }
  };

  return (
    <AuthProvider>
      {renderContent()}
    </AuthProvider>
  );
}