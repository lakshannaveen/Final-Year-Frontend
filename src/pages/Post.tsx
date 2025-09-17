"use client";
import { useState } from "react";
import { useAuth } from "../components/AuthContext";

interface PostServiceFormProps {
  setCurrentView: (view: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function PostService({ setCurrentView }: PostServiceFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Only allow if user is provider/serviceType === 'posting'
  if (!user || user.serviceType !== "posting") {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border rounded-lg p-6 text-center shadow">
        <h2 className="text-xl font-bold mb-4 text-green-700">Post a Service</h2>
        <p className="text-gray-700 mb-4">
          You need a provider account to post a service.
        </p>
        <button
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition"
          onClick={() => setCurrentView("profile")}
        >
          Go to Profile
        </button>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let imageUrl = "";

      // Upload image if provided
      if (image) {
        const formData = new FormData();
        formData.append("image", image);

        const imgRes = await fetch(`${API_URL}/api/profile/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData?.errors?.server || "Image upload failed");
        imageUrl = imgData.imageUrl;
      }

      // Send service post request
      const res = await fetch(`${API_URL}/api/services`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price,
          image: imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.errors?.server || "Failed to post service");

      setSuccess("Service posted successfully!");
      setTitle("");
      setDescription("");
      setPrice("");
      setImage(null);
    } catch (err: any) {
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white border rounded-lg p-6 shadow">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Post a Service</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Service Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="border rounded px-3 py-2"
          rows={4}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="border rounded px-3 py-2"
          required
          min={0}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border rounded px-3 py-2"
        />
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-700">{success}</div>}
        <button
          type="submit"
          className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
          disabled={loading}
        >
          {loading ? "Posting..." : "Post Service"}
        </button>
      </form>
    </div>
  );
}