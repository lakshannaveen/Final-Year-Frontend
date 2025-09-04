"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Home from "../pages/Home";
import Register from "../pages/Register";

export default function Index() {
  const [currentView, setCurrentView] = useState("home");

  const renderContent = () => {
    switch (currentView) {
      case "home":
        return <Home />;
      case "register":
        return <Register />;
      default:
        return <Home />;
    }
  };

  return (
    <div>
      {/* Only show Navbar if not on Register */}
      {currentView !== "register" && (
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      )}
      {renderContent()}
    </div>
  );
}
