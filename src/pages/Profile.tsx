"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Share,
  Edit3,
  Camera,
  Image as ImageIcon,
  X,
  Globe,
  Phone,
  Link as LinkIcon,
  LogOut,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import ProfileFeed from "./ProfileFeed";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  website?: string;
  serviceType: "finding" | "posting";
  createdAt?: string;
  bio?: string;
  profilePic?: string;
  coverImage?: string;
  status?: string;
  isVerified?: boolean;
}

interface VerificationStatus {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  docType: 'nic' | 'dl';
  submittedAt: string;
  reviewedAt?: string;
}

interface ProfileProps {
  setCurrentView: (view: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 ${className}`}></div>
  );
}

export default function Profile({ setCurrentView }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewPic, setPreviewPic] = useState("");
  const [previewCover, setPreviewCover] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const { logout } = useAuth();

  const fileInputPic = useRef<HTMLInputElement>(null);
  const fileInputCover = useRef<HTMLInputElement>(null);

  const objectUrlRef = useRef<string | null>(null);
  const coverObjectUrlRef = useRef<string | null>(null);

  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const revokeObjectUrl = (ref: React.MutableRefObject<string | null>) => {
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
      ref.current = null;
    }
  };

  const getInitial = (name = "") => name.charAt(0).toUpperCase();

  // Fetch profile and verification status
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setProfile(data.user);
          setUsername(data.user.username || "");
          setBio(data.user.bio || "");
          setPhone(data.user.phone || "");
          setWebsite(data.user.website || "");
          setStatus(data.user.status || "");
          setPreviewPic(data.user.profilePic || "");
          setPreviewCover(data.user.coverImage || "");
        } else {
          setError(data.errors?.server || "Failed to fetch profile.");
        }
      } catch {
        setError("Error connecting to server.");
      }
      setLoading(false);
    };

    const fetchVerificationStatus = async () => {
      setVerificationLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/verify/status`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setVerification(data.verification);
        }
        // If 404, no verification exists - that's fine
      } catch (error) {
        console.error("Error fetching verification status:", error);
      }
      setVerificationLoading(false);
    };

    fetchProfile();
    fetchVerificationStatus();

    return () => {
      revokeObjectUrl(objectUrlRef);
      revokeObjectUrl(coverObjectUrlRef);
    };
  }, []);

  // Fix: Close dropdown on outside click
  useEffect(() => {
    if (!statusDropdownOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [statusDropdownOpen]);

  // Preview image uploads
  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      revokeObjectUrl(objectUrlRef);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPreviewPic(url);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      revokeObjectUrl(coverObjectUrlRef);
      const url = URL.createObjectURL(file);
      coverObjectUrlRef.current = url;
      setPreviewCover(url);
    }
  };

  // Upload image to Backblaze B2 via server
  const uploadImageToB2 = async (file: File): Promise<string> => {
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/api/profile/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploading(false);
        return data.imageUrl;
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.errors?.server || "Upload failed");
    } catch (error: unknown) {
      setUploading(false);
      console.error("Upload error:", error);
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to upload image");
      }
      throw new Error("Failed to upload image");
    }
  };

  // Normalize website with protocol
  const normalizeWebsite = (url: string) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  };

  // Save profile changes
  const handleSave = async () => {
    if (!profile) return;
    const isPostingAccount = profile.serviceType === "posting";

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let profilePicUrl = profile?.profilePic || "";
      let coverImageUrl = profile?.coverImage || "";

      if (profilePic) {
        profilePicUrl = await uploadImageToB2(profilePic);
      }
      if (coverImage && isPostingAccount) {
        coverImageUrl = await uploadImageToB2(coverImage);
      }

      const body: Record<string, unknown> = {
        username,
        bio,
        profilePic: profilePicUrl,
      };

      // Only allow status update for posting accounts
      if (isPostingAccount) {
        body.status = status;
        body.phone = phone;
        body.website = normalizeWebsite(website);
        body.coverImage = coverImageUrl;
      }

      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setEditMode(false);
        setProfilePic(null);
        setCoverImage(null);

        setUsername(data.user.username || "");
        revokeObjectUrl(objectUrlRef);
        revokeObjectUrl(coverObjectUrlRef);
        setPreviewPic(data.user.profilePic || "");
        setPreviewCover(data.user.coverImage || "");
        setStatus(data.user.status || "");

        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          data.errors?.username ||
            data.errors?.server ||
            data.errors?.status ||
            "Failed to update profile."
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error connecting to server.");
      } else {
        setError("Error connecting to server.");
      }
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    revokeObjectUrl(objectUrlRef);
    revokeObjectUrl(coverObjectUrlRef);
    setUsername(profile?.username || "");
    setPreviewPic(profile?.profilePic || "");
    setPreviewCover(profile?.coverImage || "");
    setBio(profile?.bio || "");
    setPhone(profile?.phone || "");
    setWebsite(profile?.website || "");
    setStatus(profile?.status || "");
    setProfilePic(null);
    setCoverImage(null);
    setShowShareOptions(false);
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.username}'s Profile`,
          text: `Check out ${profile?.username}'s profile on Doop!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSuccess("Profile link copied to clipboard!");
      setTimeout(() => setSuccess(""), 3000);
    }
    setShowShareOptions(false);
  };

  const validateWebsite = (url: string) => {
    if (!url) return true;
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validateUsername = (name: string) => {
    return name.trim().length >= 2 && name.trim().length <= 10;
  };

  // Only two status options + none
  const statusOptions = [
    "",
    "✅ Open to work",
    "🛑 Not available",
  ];

  // Get verification status display
  const getVerificationStatusDisplay = () => {
    if (verificationLoading) {
      return <div className="text-sm text-gray-600">Loading verification status...</div>;
    }

    if (profile?.isVerified) {
      return (
        <div className="flex items-center gap-2 text-green-600 font-semibold">
          <CheckCircle size={16} />
          <span>Verified Account</span>
        </div>
      );
    }

    if (verification) {
      switch (verification.status) {
        case 'pending':
          return (
            <div className="flex items-center gap-2 text-yellow-600 font-semibold">
              <Clock size={16} />
              <span>Verification Pending</span>
            </div>
          );
        case 'approved':
          return (
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle size={16} />
              <span>Verified Account</span>
            </div>
          );
        case 'rejected':
          return (
            <div className="flex items-center gap-2 text-red-600 font-semibold">
              <XCircle size={16} />
              <span>Verification Rejected</span>
            </div>
          );
        default:
          return null;
      }
    }

    return null;
  };

  // Get verification badge for avatar
  const getVerificationBadge = () => {
    if (profile?.isVerified) {
      return (
        <div className="absolute right-0 bottom-0 transform translate-x-1/4 translate-y-1/4 z-20">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 ring-2 ring-white">
            <CheckCircle size={12} className="text-white" />
          </span>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100">
        <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden p-6">
          <Skeleton className="w-full h-48 sm:h-56 mb-[-64px] rounded-xl" />
          <div className="flex flex-col items-center -mt-20 sm:-mt-24 mb-4">
            <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white mb-2" />
            <Skeleton className="w-48 h-8 rounded-lg mb-2" />
            <Skeleton className="w-24 h-6 rounded-lg mb-2" />
          </div>
          <div className="flex flex-col items-center gap-2 mb-6">
            <Skeleton className="w-32 h-6 rounded-full" />
            <Skeleton className="w-32 h-6 rounded-full" />
          </div>
          <Skeleton className="w-full h-20 rounded-lg mb-6" />
          <Skeleton className="w-full h-24 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from_green-100 to-emerald-100">
        <div className="text-center">
          <p className="text-lg text-red-700 font-semibold mb-4">{error || "No profile data found."}</p>
          <button
            onClick={() => setCurrentView("home")}
            className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isPostingAccount = profile.serviceType === "posting";

  // Determine what status is currently displayed (edit vs saved)
  const displayStatus = editMode ? status : profile.status || "";
  const isOpenToWork = displayStatus.includes("Open to work");
  const isNotAvailable = displayStatus.includes("Not available");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-4">
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center">
        <button
          onClick={() => setCurrentView("home")}
          className="flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors px-4 py-2 rounded-lg hover:bg-green-100"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="relative flex items-center gap-3">
          {editMode ? (
            <>
              <button
                className="px-4 py-2 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg font-semibold hover:from-green-800 hover:to-emerald-800 shadow transition disabled:opacity-70 flex items-center"
                onClick={handleSave}
                disabled={
                  loading ||
                  uploading ||
                  !validateUsername(username) ||
                  (isPostingAccount && !!website && !validateWebsite(website))
                }
              >
                {loading || uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    {uploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                className="px-4 py-2 bg-gray-100 text-green-700 rounded-lg font-semibold hover:bg-gray-200 shadow transition flex items-center"
                onClick={handleCancel}
                disabled={loading || uploading}
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="flex items-center bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition"
              >
                <Share size={18} className="mr-2" />
                Share
              </button>

              {showShareOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-green-200 z-10">
                  <button
                    onClick={shareProfile}
                    className="w-full text-left px-4 py-3 text-green-700 hover:bg-green-50 rounded-t-lg flex items-center"
                  >
                    <Share size={16} className="mr-2" />
                    Share via...
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setSuccess("Profile link copied to clipboard!");
                      setShowShareOptions(false);
                      setTimeout(() => setSuccess(""), 3000);
                    }}
                    className="w-full text-left px-4 py-3 text-green-700 hover:bg-green-50 rounded-b-lg flex items-center"
                  >
                    <ImageIcon size={16} className="mr-2" />
                    Copy Link
                  </button>
                </div>
              )}
            </>
          )}

          <button
            onClick={async () => {
              await logout();
              setCurrentView("home");
            }}
            className="px-4 py-2 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-100 border border-green-200 shadow transition flex items-center"
            disabled={loading || uploading}
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
        {isPostingAccount && (
          <div className="relative h-48 sm:h-56 bg-gradient-to-r from-green-200 to-emerald-200">
            {previewCover || profile.coverImage ? (
              <img
                src={previewCover || profile.coverImage}
                alt="Cover"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-green-700 font-bold opacity-20">
                <ImageIcon size={48} />
              </div>
            )}

            {editMode && (
              <button
                className="absolute right-4 bottom-4 px-4 py-2 bg-white bg-opacity-90 text-green-700 rounded-lg shadow text-sm font-semibold hover:bg-green-100 transition flex items-center"
                onClick={() => fileInputCover.current?.click()}
              >
                <Camera size={16} className="mr-2" />
                Change Cover
              </button>
            )}

            <input
              type="file"
              accept="image/*"
              ref={fileInputCover}
              style={{ display: "none" }}
              onChange={handleCoverChange}
            />
          </div>
        )}

        <div className={`flex flex-col items-center ${isPostingAccount ? "-mt-20 sm:-mt-24" : "pt-8"} pb-8 px-6 sm:px-8`}>
          <div className="relative mb-4">
            {/* Render a separate animated ring element behind the avatar so that only the ring blinks.
                Both green and red rings blink (animate-pulse) as requested; avatar image and badge remain static. */}
            {isOpenToWork && (
              <div className="absolute -inset-2 rounded-full pointer-events-none z-0 border-4 border-green-400 animate-pulse" />
            )}
            {isNotAvailable && (
              <div className="absolute -inset-2 rounded-full pointer-events-none z-0 border-4 border-red-400 animate-pulse" />
            )}

            <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden" aria-hidden={false} title={displayStatus ? displayStatus : undefined}>
              {previewPic || profile.profilePic ? (
                <img
                  src={previewPic || profile.profilePic}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                // Default green profile circle color to match Home's default
                <div className="w-full h-full bg-green-100 flex items-center justify-center text-6xl font-bold text-green-700">
                  {getInitial(username || profile.username)}
                </div>
              )}
            </div>

            {/* small status badge on avatar (green for open, red for not available) - badge stays static */}
            {isOpenToWork && (
              <div className="absolute right-0 bottom-0 transform translate-x-1/4 translate-y-1/4 z-20">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-500 ring-2 ring-white">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            )}

            {isNotAvailable && (
              <div className="absolute right-0 bottom-0 transform translate-x-1/4 translate-y-1/4 z-20">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 ring-2 ring-white">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V6a1 1 0 112 0v3a1 1 0 11-2 0zm0 4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            )}

            {editMode && (
              <button
                className="absolute right-0 bottom-0 px-3 py-2 bg-white bg-opacity-90 text-green-700 rounded-full shadow text-sm font-semibold hover:bg-green-100 transition flex items-center z-30"
                onClick={() => fileInputPic.current?.click()}
              >
                <Camera size={16} />
              </button>
            )}

            <input
              type="file"
              accept="image/*"
              ref={fileInputPic}
              style={{ display: "none" }}
              onChange={handlePicChange}
            />
          </div>

          <div className="w-full text-center mb-6">
            {editMode ? (
              <div className="mb-2 flex flex-col items-center">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={10}
                  minLength={2}
                  className="text-3xl sm:text-4xl font-bold text-green-800 break-words mb-2 px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Username"
                  required
                />
                {(!validateUsername(username)) && (
                  <span className="text-red-500 text-sm">Username must be 2-10 characters.</span>
                )}
              </div>
            ) : (
              <h1 className="text-3xl sm:text-4xl font-bold text-green-800 break-words mb-2 inline-flex items-center justify-center">
                <span>{profile.username}</span>
                {isPostingAccount && profile.isVerified && (
                  <span
                    className="ml-3 inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-500 text-white shadow-sm"
                    title="Verified account"
                    aria-label="Verified account"
                  >
                    <CheckCircle size={14} className="text-white" />
                  </span>
                )}
              </h1>
            )}

            <p className="text-gray-600 text-lg break-all mb-4">{profile.email}</p>

            <div className="flex justify-center flex-wrap gap-3 mb-4 mt-2">
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-sm">
                {isPostingAccount ? "💼 Service Provider" : "🔍 Looking for Services"}
              </span>
              {isPostingAccount && profile.phone && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm flex items-center">
                  <Phone size={14} className="mr-1" />
                  {profile.phone}
                </span>
              )}
              {isPostingAccount && profile.website && (
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm flex items-center hover:bg-blue-200"
                >
                  <Globe size={14} className="mr-1" />
                  Website
                </a>
              )}
            </div>

            {/* Status section - Only show and allow editing for posting accounts */}
            {isPostingAccount && (
              <div className="mb-4" ref={statusDropdownRef}>
                {editMode ? (
                  <div className="flex flex-col items-center">
                    <label className="block text-green-800 font-semibold mb-2">
                      Status
                    </label>
                    <div className="relative w-[260px]">
                      <button
                        type="button"
                        className="w-full flex justify-between items-center px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-400 text-gray-800 bg-white"
                        onClick={() => setStatusDropdownOpen((o) => !o)}
                        aria-haspopup="listbox"
                        aria-expanded={statusDropdownOpen}
                        tabIndex={0}
                      >
                        <span>
                          {statusOptions.find((s) => s === status) === undefined || status === ""
                            ? "None"
                            : status}
                        </span>
                        <ChevronDown size={18} className="ml-2 text-green-700" />
                      </button>
                      {statusDropdownOpen && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-green-200 rounded-lg shadow">
                          {statusOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`block w-full text-left px-4 py-2 hover:bg-green-50 text-gray-800 ${
                                status === option
                                  ? "bg-green-100 font-semibold"
                                  : ""
                              }`}
                              onClick={() => {
                                setStatus(option);
                                setStatusDropdownOpen(false);
                              }}
                            >
                              {option === "" ? "None" : option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {status && status.length > 32 && (
                      <span className="text-red-500 text-sm">
                        Status must be 32 characters or less.
                      </span>
                    )}
                  </div>
                ) : (
                  displayStatus && (
                    <span className="inline-block px-4 py-1 bg-yellow-100 text-yellow-900 rounded-full font-semibold text-sm mb-2">
                      {displayStatus}
                    </span>
                  )
                )}
              </div>
            )}

            <p className="text-gray-500 text-sm">
              Joined:{" "}
              {profile.createdAt &&
                new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </p>
          </div>

          {isPostingAccount && editMode && (
            <div className="w-full max-w-lg mb-6 space-y-4">
              <div>
                <label className="block text-green-800 font-semibold mb-2 flex items-center">
                  <Phone size={16} className="mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-400 text-gray-800"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-green-800 font-semibold mb-2 flex items-center">
                  <LinkIcon size={16} className="mr-2" />
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-400 text-gray-800"
                  placeholder="https://example.com"
                />
                {website && !validateWebsite(website) && (
                  <p className="text-red-500 text-sm mt-1">Please enter a valid URL</p>
                )}
              </div>
            </div>
          )}

          {isPostingAccount && !editMode && (
            <div className="w-full max-w-lg mb-6 bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-green-800 font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                {profile.phone && (
                  <div className="flex items-center">
                    <Phone size={16} className="text-green-700 mr-2" />
                    <span className="text-gray-700">{profile.phone}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center">
                    <Globe size={16} className="text-green-700 mr-2" />
                    <a
                      href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Verification section */}
              <div className="mt-4 border-t pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-800">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l.7 2.16a1 1 0 00.95.69h2.28c.969 0 1.371 1.24.588 1.81l-1.846 1.34a1 1 0 00-.364 1.118l.7 2.16c.3.921-.755 1.688-1.54 1.118L10 12.347l-1.9 1.416c-.785.57-1.84-.197-1.54-1.118l.7-2.16a1 1 0 00-.364-1.118L5.05 6.587c-.783-.57-.38-1.81.588-1.81h2.28a1 1 0 00.95-.69l.7-2.16z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1">
                    {verification ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-800">Verification Status</h4>
                          {getVerificationStatusDisplay()}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {verification.status === 'pending' && 
                            "Your verification request is under review. This usually takes 24-48 hours."}
                          {verification.status === 'approved' && 
                            "Your account has been verified! You now have a verified badge on your profile."}
                          {verification.status === 'rejected' && 
                            "Your verification was rejected. Please check your documents and submit again."}
                        </p>
                        {verification.status === 'rejected' && (
                          <button
                            onClick={() => setCurrentView("verify")}
                            className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-500 transition"
                          >
                            Submit Again
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-700 mb-2">
                          Verify your account to gain trust from customers. Verification will allow you to
                          submit documents and get a verified badge on your profile. This helps increase
                          visibility and user confidence.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setCurrentView("verify")}
                            className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-500 transition"
                          >
                            Start Verification
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="w-full max-w-lg mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-green-800 font-semibold text-lg">About Me</label>
              <div className="flex items-center gap-3">
                {!editMode && (
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setShowShareOptions(false);
                    }}
                    className="text-green-700 hover:text-green-900 flex items-center text-sm"
                  >
                    <Edit3 size={16} className="mr-1" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {editMode ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-400 resize-none text-gray-800"
                placeholder="Tell others about yourself, your skills, or what you're looking for..."
              />
            ) : (
              <div className="bg-green-50 text-gray-800 px-5 py-4 rounded-lg border border-green-100 min-h-[120px]">
                {profile.bio ? (
                  <p className="leading-relaxed">{profile.bio}</p>
                ) : (
                  <p className="text-gray-500 italic">No bio added yet. Click edit to add one!</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4 flex-wrap justify-center w-full max-w-md">
            {editMode ? (
              <>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg font-semibold hover:from-green-800 hover:to-emerald-800 shadow transition disabled:opacity-70 flex items-center"
                  onClick={handleSave}
                  disabled={
                    loading ||
                    uploading ||
                    !validateUsername(username) ||
                    (isPostingAccount && !!website && !validateWebsite(website))
                  }
                >
                  {loading || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      {uploading ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>

                <button
                  className="px-6 py-3 bg-gray-100 text-green-700 rounded-lg font-semibold hover:bg-gray-200 shadow transition flex items-center"
                  onClick={handleCancel}
                  disabled={loading || uploading}
                >
                  <X size={18} className="mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg font-semibold hover:from-green-800 hover:to-emerald-800 shadow transition flex items-center"
                onClick={() => {
                  setEditMode(true);
                  setShowShareOptions(false);
                }}
              >
                <Edit3 size={18} className="mr-2" />
                Edit Profile
              </button>
            )}
          </div>

          {success && (
            <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-center w-full max-w-md border border-green-200">
              {success}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg text-center w-full max-w-md border border-red-200">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Show your posts after profile card */}
      <ProfileFeed />
    </div>
  );
}