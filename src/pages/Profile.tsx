"use client";
import React, { useEffect, useState, useRef } from "react";

interface UserProfile {
  username: string;
  email: string;
  phone?: string;
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
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewPic, setPreviewPic] = useState("");
  const [previewCover, setPreviewCover] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputPic = useRef<HTMLInputElement>(null);
  const fileInputCover = useRef<HTMLInputElement>(null);

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
          setPreviewPic(data.user.profilePic || "");
          setPreviewCover(data.user.coverImage || "");
        } else {
          setError(data.errors?.server || "Failed to fetch profile.");
        }
      } catch (err) {
        setError("Error connecting to server.");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Preview image uploads
  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      setPreviewPic(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setPreviewCover(URL.createObjectURL(file));
    }
  };

  // Upload image to server or cloud storage (replace this with actual upload logic!)
  const uploadImage = async (file: File): Promise<string> => {
    // Here, integrate with your server/cloud (e.g. Cloudinary, S3)
    // For demo, return a placeholder
    return new Promise((resolve) => {
      setTimeout(() => resolve(previewPic || previewCover), 1000);
    });
  };

  // Save profile changes
  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let profilePicUrl = previewPic;
      let coverImageUrl = previewCover;
      if (profilePic) profilePicUrl = await uploadImage(profilePic);
      if (coverImage) coverImageUrl = await uploadImage(coverImage);

      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          profilePic: profilePicUrl,
          coverImage: coverImageUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setEditMode(false);
        setSuccess("Profile updated!");
      } else {
        setError(data.errors?.server || "Failed to update profile.");
      }
    } catch (err) {
      setError("Error connecting to server.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100">
        <p className="text-lg text-green-700 font-semibold">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100">
        <p className="text-lg text-red-700 font-semibold">{error || "No profile data found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 px-3">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-44 sm:h-56 bg-gradient-to-r from-green-200 to-emerald-200">
          {profile.coverImage || previewCover ? (
            <img
              src={previewCover || profile.coverImage}
              alt="Cover"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-green-700 font-bold opacity-20">
              +
            </div>
          )}
          {editMode && (
            <button
              className="absolute right-4 bottom-4 px-3 py-1 bg-white bg-opacity-90 text-green-700 rounded shadow text-xs font-semibold hover:bg-green-100 transition"
              onClick={() => fileInputCover.current?.click()}
            >
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
        {/* Card Content */}
        <div className="flex flex-col items-center -mt-16 sm:-mt-20 pb-8 px-4 sm:px-8">
          {/* Avatar */}
          <div className="relative mb-2">
            {profile.profilePic || previewPic ? (
              <img
                src={previewPic || profile.profilePic}
                alt="Profile"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 border-4 border-white flex items-center justify-center text-6xl font-bold text-white shadow-lg">
                {getInitial(profile.username)}
              </div>
            )}
            {editMode && (
              <button
                className="absolute right-2 bottom-2 px-3 py-1 bg-white bg-opacity-90 text-green-700 rounded shadow text-xs font-semibold hover:bg-green-100 transition"
                onClick={() => fileInputPic.current?.click()}
              >
                Change Photo
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
          <div className="w-full text-center">
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-green-700 break-words">{profile.username}</h1>
            <p className="text-gray-600 text-sm sm:text-base break-all">{profile.email}</p>
            <div className="mt-2 flex justify-center flex-wrap gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold text-xs sm:text-sm">
                {profile.serviceType === "finding" ? "Finding a Service" : "Posting a Service"}
              </span>
              {profile.phone && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-xs sm:text-sm">
                  {profile.phone}
                </span>
              )}
            </div>
            <p className="mt-1 text-gray-400 text-xs sm:text-sm">
              Joined: {profile.createdAt && new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Bio */}
          <div className="mt-6 w-full max-w-lg">
            <label className="block text-green-700 font-semibold mb-1 text-left">Bio</label>
            {editMode ? (
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 resize-none text-black"
                placeholder="Write something about yourself..."
              />
            ) : (
              <div className="bg-green-50 text-gray-700 px-4 py-2 rounded-lg min-h-[40px] break-words border border-green-100">
                {profile.bio || <span className="text-gray-400">No bio added yet.</span>}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-7 flex gap-3 flex-wrap justify-center">
            {editMode ? (
              <>
                <button
                  className="px-6 py-2 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded font-semibold hover:from-green-800 hover:to-emerald-800 shadow transition"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  className="px-6 py-2 bg-gray-100 text-green-700 rounded font-semibold hover:bg-gray-200 shadow transition"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="px-6 py-2 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded font-semibold hover:from-green-800 hover:to-emerald-800 shadow transition"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
            )}
            <button
              className="px-6 py-2 bg-white text-green-700 rounded font-semibold hover:bg-green-50 shadow border border-green-700 transition"
              onClick={() => setCurrentView("home")}
            >
              Back to Home
            </button>
          </div>
          {success && <p className="mt-5 text-green-700 font-semibold text-center">{success}</p>}
          {error && <p className="mt-5 text-red-700 font-semibold text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}