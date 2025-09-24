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

export default function Page() {
  const [currentView, setCurrentView] = useState("home");
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);
  const [chatRecipient, setChatRecipient] = useState<{ recipientId: string, recipientUsername: string } | null>(null);

  const handleShowPublicProfile = (userId: string) => {
    setPublicProfileId(userId);
    setCurrentView("publicprofile");
  };

  const handleShowMessage = (recipientId: string, recipientUsername: string) => {
    setChatRecipient({ recipientId, recipientUsername });
    setCurrentView("message");
  };

  const renderContent = () => {
    switch (currentView) {
      case "home":
        return (
          <Home
            setCurrentView={setCurrentView}
            onShowPublicProfile={handleShowPublicProfile}
            onShowMessage={handleShowMessage}
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
        return publicProfileId ? (
          <PublicProfile userId={publicProfileId} setCurrentView={setCurrentView} />
        ) : (
          <Home
            setCurrentView={setCurrentView}
            onShowPublicProfile={handleShowPublicProfile}
            onShowMessage={handleShowMessage}
          />
        );
      case "message":
        return chatRecipient ? (
          <Message
            setCurrentView={setCurrentView}
            recipientId={chatRecipient.recipientId}
            recipientUsername={chatRecipient.recipientUsername}
          />
        ) : (
          <Home
            setCurrentView={setCurrentView}
            onShowPublicProfile={handleShowPublicProfile}
            onShowMessage={handleShowMessage}
          />
        );
      default:
        return (
          <Home
            setCurrentView={setCurrentView}
            onShowPublicProfile={handleShowPublicProfile}
            onShowMessage={handleShowMessage}
          />
        );
    }
  };

  return (
    <AuthProvider>
      {renderContent()}
    </AuthProvider>
  );
}