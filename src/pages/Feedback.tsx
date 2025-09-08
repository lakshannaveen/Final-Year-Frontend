"use client";
import React, { useState } from "react";
import { ArrowLeft, Star } from "lucide-react";

interface FeedbackProps {
  setCurrentView: (view: string) => void;
}

export default function Feedback({ setCurrentView }: FeedbackProps) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState({ message: "", rating: "" });
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    let valid = true;
    const newErrors = { message: "", rating: "" };

    const wordCount = message.trim().split(/\s+/).length;
    if (!message.trim()) {
      newErrors.message = "Message is required";
      valid = false;
    } else if (wordCount < 2) {
      newErrors.message = "Message must be at least 2 words";
      valid = false;
    } else if (wordCount > 50) {
      newErrors.message = "Message must not exceed 50 words";
      valid = false;
    }

    if (rating < 1 || rating > 5) {
      newErrors.rating = "Rating must be between 1 and 5 stars";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log("Feedback submitted:", { message, rating });
    setSubmitted(true);
    setMessage("");
    setRating(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Back Button */}
      <div className="flex items-center p-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md">
        <button
          onClick={() => setCurrentView("home")}
          className="p-2 rounded hover:bg-green-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-4 text-2xl md:text-3xl font-bold">Feedback</h1>
      </div>

      {/* Feedback Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
            Share Your Feedback
          </h2>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-green-700 font-semibold mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors({ ...errors, message: "" });
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 resize-none text-gray-800 placeholder-gray-400 leading-relaxed ${
                errors.message ? "border-red-500 focus:ring-red-300" : "border-green-300"
              }`}
              rows={5}
              placeholder="Write your feedback..."
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-green-700 font-semibold mb-1">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    size={28}
                    className={`${
                      star <= rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 text-white font-semibold hover:from-green-800 hover:to-emerald-800 shadow-md transition"
          >
            Submit Feedback
          </button>

          {submitted && (
            <p className="text-green-700 text-center mt-4 font-medium">
              Thank you for your feedback!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
