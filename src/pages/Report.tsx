"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

interface ReportProps {
  setCurrentView: (view: string) => void;
  postId: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Report({ setCurrentView, postId }: ReportProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) {
      setMessageType("error");
      return setMessage("No post selected to report.");
    }
    if (!reason.trim()) {
      setMessageType("error");
      return setMessage("Please provide a reason.");
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reason }),
      });
      if (res.ok) {
        setMessageType("success");
        setMessage("Report submitted. Thank you.");
        setTimeout(() => setCurrentView("home"), 1400);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessageType("error");
        setMessage(data?.message || "Failed to submit report.");
      }
    } catch (err) {
      setMessageType("error");
      setMessage("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentView("home")}
            className="flex items-center text-green-700 font-semibold hover:text-green-800 transition px-3 py-2 rounded"
          >
            <ArrowLeft size={20} className="mr-2" /> Back
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
          <h2 className="text-2xl font-bold mb-2 text-green-700">Report Post</h2>
          <p className="text-sm text-gray-600 mb-4">Post ID: {postId ?? "(unknown)"}</p>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-green-700 mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 min-h-[140px] border-green-300 focus:outline-none focus:ring-2 focus:ring-green-300 placeholder:text-gray-700"
              placeholder="Describe why you are reporting this post (spam, offensive, scam, etc.)"
              style={{ color: "black" }}
            />

            {message && (
              <div className={`mb-4 text-sm ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>{message}</div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>

              <button
                type="button"
                onClick={() => setCurrentView("home")}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
