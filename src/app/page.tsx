"use client";

import { useState } from "react";
import Home from "../pages/Home";
import Register from "../pages/Register";
import SignIn from "../pages/Signin";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import Contact from "../pages/Contact";
import Feedback from "../pages/Feedback";
import Profile from "../pages/Profile"; 

export default function Index() {
  const [currentView, setCurrentView] = useState("home");

  const renderContent = () => {
    switch (currentView) {
      case "home":
        return <Home setCurrentView={setCurrentView} />;
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
        return <Profile setCurrentView={setCurrentView} />; // ✅ added
      default:
        return <Home setCurrentView={setCurrentView} />;
    }
  };

  return <div>{renderContent()}</div>;
}
