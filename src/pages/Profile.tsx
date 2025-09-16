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
} from "lucide-react";
import { useAuth } from "../components/AuthContext";

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
}

interface ProfileProps {
  setCurrentView: (view: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Profile({ setCurrentView }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewPic, setPreviewPic] = useState("");
  const [previewCover, setPreviewCover] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { logout } = useAuth();

  const fileInputPic = useRef<HTMLInputElement>(null);
  const fileInputCover = useRef<HTMLInputElement>(null);

  // Keep track of object URLs to revoke and avoid memory leaks
  const objectUrlRef = useRef<string | null>(null);
  const coverObjectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = (ref: React.MutableRefObject<string | null>) => {
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
      ref.current = null;
    }
  };

  // Helper to get first letter
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
          setBio(data.user.bio || "");
          setPhone(data.user.phone || "");
          setWebsite(data.user.website || "");
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
      // cleanup object URLs on unmount
      revokeObjectUrl(objectUrlRef);
      revokeObjectUrl(coverObjectUrlRef);
    };
  }, []);

  // Preview image uploads
  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      // Revoke previous preview URL
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
      // Revoke previous preview URL
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

  // Save profile changes
  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let profilePicUrl = profile?.profilePic || "";
      let coverImageUrl = profile?.coverImage || "";

      // Upload new images if they exist
      if (profilePic) {
        profilePicUrl = await uploadImageToB2(profilePic);
      }

      if (coverImage && profile?.serviceType === "posting") {
        coverImageUrl = await uploadImageToB2(coverImage);
      }

      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          phone: profile?.serviceType === "posting" ? phone : undefined,
          website: profile?.serviceType === "posting" ? website : undefined,
          profilePic: profilePicUrl,
          coverImage: profile?.serviceType === "posting" ? coverImageUrl : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Update state from server
        setProfile(data.user);
        setEditMode(false);
        setProfilePic(null);
        setCoverImage(null);

        // IMPORTANT: ensure previews reflect the saved URLs
        revokeObjectUrl(objectUrlRef);
        revokeObjectUrl(coverObjectUrlRef);
        setPreviewPic(data.user.profilePic || "");
        setPreviewCover(data.user.coverImage || "");

        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.errors?.server || "Failed to update profile.");
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
    // Reset previews to the last saved values
    revokeObjectUrl(objectUrlRef);
    revokeObjectUrl(coverObjectUrlRef);
    setPreviewPic(profile?.profilePic || "");
    setPreviewCover(profile?.coverImage || "");
    setBio(profile?.bio || "");
    setPhone(profile?.phone || "");
    setWebsite(profile?.website || "");
    setProfilePic(null);
    setCoverImage(null);
    setShowShareOptions(false);
  };

  // Share profile function
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

  // Validate website URL format
  const validateWebsite = (url: string) => {
    if (!url) return true;
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
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
      {/* Header with Back Button and Actions (Share or Save/Cancel in edit mode) */}
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
                disabled={loading || uploading || (!!website && !validateWebsite(website))}
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

          {/* Logout is provided here (moved from Navbar) */}
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
        {/* Cover Image - Only for posting accounts */}
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

        {/* Card Content */}
        <div className={`flex flex-col items-center ${isPostingAccount ? "-mt-20 sm:-mt-24" : "pt-8"} pb-8 px-6 sm:px-8`}>
          {/* Avatar */}
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
                  {getInitial(profile.username)}
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

          {/* Info */}
          <div className="w-full text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-800 break-words mb-2">{profile.username}</h1>
            <p className="text-gray-600 text-lg break-all mb-4">{profile.email}</p>

            <div className="flex justify-center flex-wrap gap-3 mb-4">
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-sm">
                {isPostingAccount ? "💼 Service Provider" : "🔍 Looking for Services"}
              </span>
              {profile.phone && isPostingAccount && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm flex items-center">
                  <Phone size={14} className="mr-1" />
                  {profile.phone}
                </span>
              )}
              {profile.website && isPostingAccount && (
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm flex items-center">
                  <Globe size={14} className="mr-1" />
                  Website
                </span>
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

          {/* Contact Information - Only for posting accounts in edit mode */}
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

          {/* Display contact info for posting accounts in view mode */}
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

          {/* Bio */}
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

          {/* Action Buttons (bottom) */}
          <div className="flex gap-4 flex-wrap justify-center w-full max-w-md">
            {editMode ? (
              <>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg font-semibold hover:from-green-800 hover:to-emerald-800 shadow transition disabled:opacity-70 flex items-center"
                  onClick={handleSave}
                  disabled={loading || uploading || (!!website && !validateWebsite(website))}
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

          {/* Success/Error Messages */}
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
    </div>
  );
}