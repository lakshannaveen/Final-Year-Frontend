"use client";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { Menu, X, User, Mail } from "lucide-react";
import Image from "next/image";

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AppUser {
  username?: string;
  profilePic?: string;
  serviceType?: string;
  [key: string]: string | undefined;
}

function getProfilePicFromUser(u: unknown): string {
  if (typeof u === "object" && u !== null) {
    const obj = u as Record<string, unknown>;
    const pic = obj["profilePic"];
    if (typeof pic === "string") return pic;
  }
  return "";
}

export default function Navbar({ currentView, setCurrentView }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth() as { user: AppUser | null; loading: boolean };

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const avatarLetter = user?.username ? user.username.charAt(0).toUpperCase() : null;

  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setMenuOpen(false);
  };

  useEffect(() => {
    let ignore = false;
    const loadAvatar = async () => {
      if (!user) {
        setAvatarUrl("");
        return;
      }
      const picFromAuth = getProfilePicFromUser(user);
      if (picFromAuth) {
        setAvatarUrl(picFromAuth);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setAvatarUrl(data?.user?.profilePic || "");
      } catch {}
    };
    loadAvatar();
    return () => { ignore = true; };
  }, [user]);

  const isProvider = user?.serviceType === "posting";

  // Skeleton loading bar
  if (loading) {
    return (
      <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg animate-pulse"></div>
            <span className="text-2xl font-bold tracking-wide">Doop</span>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="h-6 w-20 bg-green-600 rounded animate-pulse mx-3"></div>
            <div className="h-6 w-36 bg-green-600 rounded animate-pulse mx-3"></div>
            <div className="h-6 w-20 bg-green-600 rounded animate-pulse mx-3"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-row justify-between items-center">
        {/* Left: Logo */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2 hover:opacity-90 transition"
        >
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
          <span className="text-2xl font-bold tracking-wide">Doop</span>
        </button>
        {/* Desktop Center Menu */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-2">
          <button
            onClick={() => handleNavClick("home")}
            className={`transition-colors font-medium text-lg px-4 py-2 rounded-lg ${
              currentView === "home"
                ? "bg-white text-green-700 shadow"
                : "hover:bg-green-800 hover:text-green-200 text-white"
            }`}
          >
            Home
          </button>
          {isProvider && (
            <button
              onClick={() => handleNavClick("post")}
              className={`transition-colors font-medium text-lg px-4 py-2 rounded-lg ${
                currentView === "post"
                  ? "bg-white text-green-700 shadow"
                  : "hover:bg-green-800 hover:text-green-200 text-white"
              }`}
            >
              Post a Service
            </button>
          )}
          <button
            onClick={() => handleNavClick("inbox")}
            className={`transition-colors font-medium text-lg flex items-center gap-2 px-4 py-2 rounded-lg ${
              currentView === "inbox"
                ? "bg-white text-green-700 shadow"
                : "hover:bg-green-800 hover:text-green-200 text-white"
            }`}
            aria-label="Inbox"
            style={{ justifyContent: "center" }}
          >
            <Mail size={20} />
            <span className="hidden sm:inline">Inbox</span>
          </button>
        </div>
        {/* Right: Profile + Hamburger */}
        <div className="flex items-center gap-3">
          {/* Only show ONE profile avatar, always on top right */}
          {user ? (
            <button
              onClick={() => handleNavClick("profile")}
              aria-label="Profile"
              className={`relative flex items-center justify-center rounded-full p-[2px] transition-all ${
                currentView === "profile"
                  ? "ring-2 ring-white"
                  : "ring-2 ring-white/20 hover:ring-white"
              }`}
            >
              {avatarUrl ? (
                <span className="block w-8 h-8 rounded-full overflow-hidden bg-white">
                  <img
                    src={avatarUrl}
                    alt="Profile avatar"
                    width={32}
                    height={32}
                    loading="lazy"
                    className="w-8 h-8 object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </span>
              ) : avatarLetter ? (
                <span className="w-8 h-8 rounded-full bg-white text-green-700 flex items-center justify-center font-bold">
                  {avatarLetter}
                </span>
              ) : (
                <User size={24} />
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleNavClick("signin")}
                className="px-4 py-2 rounded-lg bg-white text-green-800 font-semibold hover:bg-green-50 hover:text-green-900 hover:shadow-md transition-all border border-green-100"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick("register")}
                className={`px-4 py-2 rounded-lg border-2 border-white font-semibold hover:bg-white hover:text-green-700 transition-all ${
                  currentView === "register"
                    ? "bg-white text-green-700"
                    : "text-white"
                }`}
              >
                Register
              </button>
            </>
          )}
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg bg-green-800 hover:bg-green-600 transition ml-2"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className="md:hidden">
        {menuOpen && (
          <div className="bg-gradient-to-b from-green-800 to-emerald-700 text-white flex flex-col gap-2 px-4 py-4 border-t border-green-600">
            <button
              onClick={() => handleNavClick("home")}
              className={`w-full text-center font-medium text-lg px-4 py-3 rounded-lg ${
                currentView === "home"
                  ? "bg-white text-green-700 shadow"
                  : "hover:bg-green-900 hover:text-green-200 text-white"
              }`}
            >
              Home
            </button>
            {isProvider && (
              <button
                onClick={() => {
                  handleNavClick("post");
                  setMenuOpen(false);
                }}
                className={`w-full text-center font-medium text-lg px-4 py-3 rounded-lg ${
                  currentView === "post"
                    ? "bg-white text-green-700 shadow"
                    : "hover:bg-green-900 hover:text-green-200 text-white"
                }`}
              >
                Post a Service
              </button>
            )}
            <button
              onClick={() => {
                handleNavClick("inbox");
                setMenuOpen(false);
              }}
              className={`w-full text-center font-medium text-lg flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
                currentView === "inbox"
                  ? "bg-white text-green-700 shadow"
                  : "hover:bg-green-900 hover:text-green-200 text-white"
              }`}
              aria-label="Inbox"
            >
              <Mail size={22} /> Inbox
            </button>
            {/* No extra avatar here! */}
            {!user && (
              <>
                <button
                  onClick={() => {
                    handleNavClick("signin");
                    setMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg font-semibold text-center transition-all border mt-2 ${
                    currentView === "signin"
                      ? "bg-white text-green-700"
                      : "bg-white text-green-800 hover:bg-green-50 hover:text-green-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    handleNavClick("register");
                    setMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg border-2 font-semibold text-center transition-all mt-2 ${
                    currentView === "register"
                      ? "bg-white text-green-700 border-white"
                      : "text-white border-white hover:bg-white hover:text-green-700"
                  }`}
                >
                  Register
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}