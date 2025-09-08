"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Home from "../pages/Home";
import Register from "../pages/Register";
import SignIn from "../pages/Signin";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import Contact from "../pages/Contact";
import Feedback from "../pages/Feedback";

export default function Index() {
  const [currentView, setCurrentView] = useState("home");

  const renderContent = () => {
    switch (currentView) {
      case "home":
        return <Home />;
      case "register":
        return <Register setCurrentView={setCurrentView} />;
      case "signin":
        return <SignIn setCurrentView={setCurrentView} />;
      case "privacy":
        return <Privacy />;
      case "terms":
        return <Terms />;
      case "contact":
        return <Contact />;
      case "feedback":
        return <Feedback />;
      default:
        return <Home />;
    }
  };

  return (
    <div>
      {/* Hide Navbar on Register & SignIn */}
      {currentView !== "register" && currentView !== "signin" && (
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      )}
      {renderContent()}
    </div>
  );
}
