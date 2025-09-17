"use client";
import { useState } from "react";
import { useAuth } from "../components/AuthContext";
import Navbar from "../components/Navbar";

interface PostServiceFormProps {
  setCurrentView: (view: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Types for Nominatim reverse geocoding response
interface NominatimReverseResult {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state_district?: string;
    state?: string;
    district?: string;
  };
  display_name: string;
}

export default function PostService({ setCurrentView }: PostServiceFormProps) {
  const { user, loading: authLoading } = useAuth();
  const [serviceName, setServiceName] = useState("");
  const [location, setLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"hourly" | "task" | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [websiteLink, setWebsiteLink] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // For Navbar
  const [currentView, setCurrentViewLocal] = useState("post");

  // Spinner for location icon
  const [locationLoading, setLocationLoading] = useState(false);

  // Navbar links fix: update setCurrentView in Navbar and here to sync navigation
  const handleNavChange = (view: string) => {
    setCurrentViewLocal(view);
    setCurrentView(view);
  };

  // Only allow if user is provider/serviceType === 'posting'
  if (!authLoading && (!user || user.serviceType !== "posting")) {
    return (
      <>
        <Navbar currentView={currentView} setCurrentView={handleNavChange} />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100 p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md z-10 text-center">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Post a Service</h2>
            <p className="text-gray-700 mb-4">
              You need a provider account to post a service.
            </p>
            <button
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition font-semibold"
              onClick={() => handleNavChange("profile")}
            >
              Go to Profile
            </button>
          </div>
        </div>
      </>
    );
  }

  // Get user's current location as city/area name, not lat/lng
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setModal({ type: "error", message: "Geolocation is not supported by your browser." });
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Use Nominatim OpenStreetMap reverse geocoding to get area/city name
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
          const res = await fetch(url, {
            headers: { "User-Agent": "Kone-frontend/1.0 (lakshannaveen@gmail.com)" }
          });
          const data: NominatimReverseResult = await res.json();
          const area =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.suburb ||
            data.address?.county ||
            data.address?.state_district ||
            data.address?.state ||
            data.address?.district;
          const locationStr = area
            ? area
            : data.display_name;
          setLocation(locationStr);
        } catch {
          setModal({ type: "error", message: "Unable to retrieve your location name." });
        }
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setModal({ type: "error", message: "Unable to retrieve your location." });
      }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setModal({ type: "error", message: "Photo must be 5MB or less." });
        return;
      }
      setPhoto(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        setModal({ type: "error", message: "Video must be 20MB or less." });
        return;
      }
      // Validate video duration min 2 seconds
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoEl.src);
        if (videoEl.duration < 2) {
          setModal({ type: "error", message: "Video must be at least 2 seconds long." });
        } else {
          setVideo(file);
        }
      };
      videoEl.src = URL.createObjectURL(file);
    }
  };

  // Form validation
  const validateForm = () => {
    if (!serviceName.trim()) return "Service name is required.";
    if (serviceName.split(" ").length > 50)
      return "Service name must be maximum 50 words.";
    if (!location.trim()) return "Location is required.";
    if (!contactNumber.trim())
      return "Contact number is required.";
    // Simple phone validation
    if (!/^(\+?\d{10,15})$/.test(contactNumber.trim()))
      return "Enter a valid contact number (10-15 digits, optional +).";
    if (!price.trim() || isNaN(Number(price)) || Number(price) < 0)
      return "Valid price is required.";
    if (!priceType) return "Select a price type.";
    if (!photo && !video)
      return "Upload at least one photo or video of your work.";
    if (photo && photo.size > 5 * 1024 * 1024)
      return "Photo must be 5MB or less.";
    if (video) {
      if (video.size > 20 * 1024 * 1024)
        return "Video must be 20MB or less.";
      // Can't check duration here, but handled in file input
    }
    if (websiteLink && !/^https?:\/\/.+\..+/.test(websiteLink))
      return "Enter a valid website URL (starts with http:// or https://).";
    if (description && description.split(" ").length > 20)
      return "Description must be maximum 20 words.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModal(null);

    const validationError = validateForm();
    if (validationError) {
      setModal({ type: "error", message: validationError });
      return;
    }

    setLoading(true);

    try {
      let photoUrl = "";
      let videoUrl = "";

      // Upload photo if provided
   if (photo) {
  const photoForm = new FormData();
  photoForm.append("file", photo);

  const imgRes = await fetch(`${API_URL}/api/feed/upload`, {
    method: "POST",
    credentials: "include",
    body: photoForm,
  });
  const imgData = await imgRes.json();
  if (!imgRes.ok) throw new Error(imgData?.errors?.server || "Photo upload failed");
  photoUrl = imgData.fileUrl;
}

// Upload video if provided
if (video) {
  const videoForm = new FormData();
  videoForm.append("file", video);

  const vidRes = await fetch(`${API_URL}/api/feed/upload`, {
    method: "POST",
    credentials: "include",
    body: videoForm,
  });
  const vidData = await vidRes.json();
  if (!vidRes.ok) throw new Error(vidData?.errors?.server || "Video upload failed");
  videoUrl = vidData.fileUrl;
}

      // Save to Feed DB
      const res = await fetch(`${API_URL}/api/feed`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: serviceName,
          location,
          contactNumber,
          price,
          priceType,
          priceCurrency: "LKR",
          photo: photoUrl,
          video: videoUrl,
          websiteLink,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.errors?.server || "Failed to post service");

      setModal({ type: "success", message: "Service posted successfully!" });
      setServiceName("");
      setLocation("");
      setContactNumber("");
      setPrice("");
      setPriceType("");
      setPhoto(null);
      setVideo(null);
      setWebsiteLink("");
      setDescription("");
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Consistent placeholder text color for all inputs, including file fields, and textarea
  const placeholderColorClass = "placeholder:text-black";

  return (
    <>
      <Navbar currentView={currentView} setCurrentView={handleNavChange} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100 p-6">
        {/* Modal */}
        {modal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg text-center relative">
              <h3
                className={`font-bold text-lg mb-2 ${
                  modal.type === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {modal.type === "success" ? "Success" : "Error"}
              </h3>
              <p className="text-black mb-4 whitespace-pre-line">{modal.message}</p>
              <button
                className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 font-semibold"
                onClick={() => setModal(null)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md z-10">
          <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">
            Post a Service
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Service Name */}
            <div>
              <label className="block text-green-700 font-semibold mb-1">
                Service Name <span className="text-xs text-green-600">(max 50 words)</span>
              </label>
              <input
                type="text"
                placeholder="Enter service name"
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 ${placeholderColorClass}`}
                required
                style={{ color: "black" }}
              />
            </div>
            {/* Location */}
            <div>
              <label className="block text-green-700 font-semibold mb-1">
                Location (City/Area)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Enter location or use current location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 ${placeholderColorClass}`}
                  required
                  style={{ color: "black" }}
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition font-semibold flex items-center justify-center min-w-[40px] min-h-[40px]"
                  onClick={handleGetCurrentLocation}
                  title="Use current location"
                  disabled={locationLoading}
                  style={{ position: "relative" }}
                >
                  {/* Spinner when loading, else icon */}
                  {locationLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-green-200 border-t-green-700 rounded-full animate-spin"></span>
                  ) : (
                    <span role="img" aria-label="location">📍</span>
                  )}
                </button>
              </div>
            </div>
            {/* Contact Number */}
            <div>
              <label className="block text-green-700 font-semibold mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                placeholder="Enter contact number"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 ${placeholderColorClass}`}
                required
                style={{ color: "black" }}
                maxLength={16}
              />
            </div>
            {/* Price */}
            <div>
              <label className="block text-green-700 font-semibold mb-1">
                Price (LKR)
              </label>
              <input
                type="number"
                placeholder="Enter price in LKR"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min={0}
                step={0.01}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 ${placeholderColorClass}`}
                style={{ color: "black" }}
              />
            </div>
            {/* Price Type */}
            <div>
              <span className="block text-green-700 font-semibold mb-1">
                Price Type
              </span>
              <div className="flex gap-4">
                <label
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    priceType === "hourly"
                      ? "bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md"
                      : "bg-white text-green-700 border border-green-700 hover:bg-green-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="priceType"
                    value="hourly"
                    checked={priceType === "hourly"}
                    onChange={() => setPriceType("hourly")}
                    className="mr-1 hidden"
                    required
                  />
                  Hourly
                </label>
                <label
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    priceType === "task"
                      ? "bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md"
                      : "bg-white text-green-700 border border-green-700 hover:bg-green-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="priceType"
                    value="task"
                    checked={priceType === "task"}
                    onChange={() => setPriceType("task")}
                    className="mr-1 hidden"
                    required
                  />
                  Specific Task
                </label>
              </div>
            </div>
            {/* Photo Upload */}
            <div>
              <label className="block text-green-700 font-semibold mb-1">
                Photo of Your Work <span className="text-xs text-green-600">(max 5MB)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 ${placeholderColorClass}`}
                style={{ color: "black" }}
                title="Select photo (max 5MB)"
                placeholder="Select photo"
              />
              {photo && (
                <span className="text-green-700 text-sm mt-1 block">
                  Selected: {photo.name}
                </span>
              )}
            </div>
            {/* Video Upload */}
            <div>
              <label className="block text-green-700 font-semibold mb-1">
                Video of Your Work (optional) <span className="text-xs text-green-600">(min 2s, max 20MB)</span>
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 ${placeholderColorClass}`}
                style={{ color: "black" }}
                title="Select video (min 2s, max 20MB)"
                placeholder="Select video"
              />
              {video && (
                <span className="text-green-700 text-sm mt-1 block">
                  Selected: {video.name}
                </span>
              )}
            </div>
            {/* Website Link */}
            <div>
              <label className="block text-green-700 font-semibold mb-1">
                Website Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://yourwebsite.com"
                value={websiteLink}
                onChange={e => setWebsiteLink(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 ${placeholderColorClass}`}
                style={{ color: "black" }}
              />
            </div>
            {/* Description */}
            <div>
              <label className="block text-green-700 font-semibold mb-1">
                Description (optional, max 20 words)
              </label>
              <textarea
                placeholder="Describe your service in max 20 words"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-green-300 focus:ring-green-300 ${placeholderColorClass}`}
                style={{ color: "black" }}
                rows={2}
                maxLength={200}
              />
              <span className="text-xs text-gray-500">
                {description.split(" ").filter(Boolean).length}/20 words
              </span>
            </div>
            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 text-white font-semibold hover:from-green-800 hover:to-emerald-800 shadow-md transition disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Posting..." : "Post Service"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}