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

// Define a type for your user object based on what your backend returns
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

  return (
    <nav className="bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left: Logo */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2 hover:opacity-90 transition"
        >
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
          <span className="text-2xl font-bold tracking-wide">Doop</span>
        </button>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => handleNavClick("home")}
            className={`hover:text-green-200 transition-colors font-medium text-lg ${
              currentView === "home" ? "text-green-200" : ""
            }`}
          >
            Home
          </button>
          {isProvider && (
            <button
              onClick={() => handleNavClick("post")}
              className={`hover:text-green-200 transition-colors font-medium text-lg ${
                currentView === "post" ? "text-green-200" : ""
              }`}
            >
              Post a Service
            </button>
          )}
          <button
            onClick={() => handleNavClick("inbox")}
            className={`hover:text-green-200 transition-colors font-medium text-lg flex items-center gap-2 ${
              currentView === "inbox" ? "text-green-200" : ""
            }`}
            aria-label="Inbox"
          >
            <Mail size={20} />
            Inbox
          </button>
          {user ? (
            <>
              <button
                onClick={() => handleNavClick("profile")}
                aria-label="Profile"
                className={`relative flex items-center justify-center rounded-full p-[2px] transition-all
                  ${currentView === "profile" ? "ring-2 ring-white" : "ring-2 ring-white/20 hover:ring-white"}`}
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
            </>
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
        </div>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg bg-green-800 hover:bg-green-600 transition"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-gradient-to-b from-green-800 to-emerald-700 text-white flex flex-col gap-4 px-6 py-6 border-t border-green-600">
          <button
            onClick={() => handleNavClick("home")}
            className={`font-medium text-lg text-center ${
              currentView === "home" ? "text-green-200" : "hover:text-green-200"
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
              className={`font-medium text-lg text-center ${
                currentView === "post" ? "text-green-200" : "hover:text-green-200"
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
            className={`font-medium text-lg text-center flex items-center gap-2 ${
              currentView === "inbox" ? "text-green-200" : "hover:text-green-200"
            }`}
            aria-label="Inbox"
          >
            <Mail size={22} /> Inbox
          </button>
          {user ? (
            <>
              <button
                onClick={() => {
                  handleNavClick("profile");
                  setMenuOpen(false);
                }}
                aria-label="Profile"
                className="flex items-center justify-center"
              >
                {avatarUrl ? (
                  <span className="block w-10 h-10 rounded-full overflow-hidden bg-white ring-2 ring-white/30">
                    <img
                      src={avatarUrl}
                      alt="Profile avatar"
                      width={40}
                      height={40}
                      loading="lazy"
                      className="w-10 h-10 object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </span>
                ) : avatarLetter ? (
                  <span className="w-10 h-10 rounded-full bg-white text-green-700 flex items-center justify-center font-bold ring-2 ring-white/30">
                    {avatarLetter}
                  </span>
                ) : (
                  <User size={28} />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  handleNavClick("signin");
                  setMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-center transition-all border ${
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
                className={`px-4 py-2 rounded-lg border-2 font-semibold text-center transition-all ${
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
    </nav>
  );
}