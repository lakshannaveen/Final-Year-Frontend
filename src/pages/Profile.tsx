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
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import ProfileFeed from "./ProfileFeed"; // Import ProfileFeed at the bottom

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
  const [loading, setLoading] = useState(true);
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

  const revokeObjectUrl = (ref: React.MutableRefObject<string | null>) => {
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
      ref.current = null;
    }
  };

  const getInitial = (name = "") => name.charAt(0).toUpperCase();

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
    fetchProfile();

    return () => {
      revokeObjectUrl(objectUrlRef);
      revokeObjectUrl(coverObjectUrlRef);
    };
  }, []);

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
        status,
      };

      if (isPostingAccount) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100">
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
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden">
              {previewPic || profile.profilePic ? (
                <img
                  src={previewPic || profile.profilePic}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-6xl font-bold text-white">
                  {getInitial(username || profile.username)}
                </div>
              )}
            </div>

            {editMode && (
              <button
                className="absolute right-0 bottom-0 px-3 py-2 bg-white bg-opacity-90 text-green-700 rounded-full shadow text-sm font-semibold hover:bg-green-100 transition flex items-center"
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
              <h1 className="text-3xl sm:text-4xl font-bold text-green-800 break-words mb-2">{profile.username}</h1>
            )}

            <p className="text-gray-600 text-lg break-all mb-4">{profile.email}</p>

            <div className="flex justify-center flex-wrap gap-3 mb-4">
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

            {/* Status section */}
            <div className="mb-4">
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
                      onBlur={() => setTimeout(() => setStatusDropdownOpen(false), 150)}
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
                status && (
                  <span className="inline-block px-4 py-1 bg-yellow-100 text-yellow-900 rounded-full font-semibold text-sm mb-2">
                    {status}
                  </span>
                )
              )}
            </div>

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

          {isPostingAccount && !editMode && (profile.phone || profile.website) && (
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
            </div>
          )}

          <div className="w-full max-w-lg mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-green-800 font-semibold text-lg">About Me</label>
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