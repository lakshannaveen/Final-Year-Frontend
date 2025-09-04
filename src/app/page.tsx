"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Home from "../pages/Home";
import Register from "../pages/Register";
import SignIn from "../pages/Signin";

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
      default:
        return <Home />;
    }
  };

  return (
    <div>
      {/* Only show Navbar if not on Register or SignIn */}
      {currentView !== "register" && currentView !== "signin" && (
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      )}
      {renderContent()}
    </div>
  );
}
