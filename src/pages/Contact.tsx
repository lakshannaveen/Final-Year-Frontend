"use client";
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

interface ContactProps {
  setCurrentView: (view: string) => void;
}

export default function Contact({ setCurrentView }: ContactProps) {
  const [formData, setFormData] = useState({ name: "", message: "" });
  const [errors, setErrors] = useState({ name: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    let valid = true;
    const newErrors = { name: "", message: "" };

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      valid = false;
    } else if (formData.name.trim().length > 30) {
      newErrors.name = "Name must not exceed 30 characters";
      valid = false;
    }

    // Message validation
    const wordCount = formData.message.trim().split(/\s+/).length;
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
      valid = false;
    } else if (wordCount < 2) {
      newErrors.message = "Message must be at least 2 words";
      valid = false;
    } else if (wordCount > 50) {
      newErrors.message = "Message must not exceed 50 words";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log("Contact submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md">
        <button
          onClick={() => setCurrentView("home")}
          className="p-2 rounded hover:bg-green-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-4 text-2xl md:text-3xl font-bold">Contact Us</h1>
      </div>

      {/* Main Content: Two Boxes */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 md:p-12">
        {/* Left Box: Contact Info */}
        <div className="md:w-1/2 bg-gradient-to-r from-green-700 to-emerald-700 text-white p-8 rounded-2xl flex flex-col justify-center items-center shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Get in Touch</h2>
          <p className="text-lg md:text-xl text-center max-w-sm mb-4">
            Have questions or need assistance? Reach out to us and we’ll respond promptly.
          </p>
          <div className="flex flex-col gap-2 text-center">
            <p className="font-semibold">Email: support@example.com</p>
            <p className="font-semibold">Phone: +94 123 456 789</p>
          </div>
        </div>

        {/* Right Box: Contact Form */}
        <div className="md:w-1/2 bg-white p-8 rounded-2xl shadow-lg flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
              Send a Message
            </h2>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-green-700 font-semibold mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: "" });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name
                    ? "border-red-500 focus:ring-red-300"
                    : "border-green-300 focus:ring-green-300"
                } text-gray-800 placeholder-gray-400`}
                placeholder="Your name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-green-700 font-semibold mb-1">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  setErrors({ ...errors, message: "" });
                }}
                rows={5}
                placeholder="Write your message..."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-none text-gray-800 placeholder-gray-400 leading-relaxed ${
                  errors.message
                    ? "border-red-500 focus:ring-red-300"
                    : "border-green-300 focus:ring-green-300"
                }`}
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-1">{errors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 text-white font-semibold hover:from-green-800 hover:to-emerald-800 shadow-md transition"
            >
              Send Message
            </button>

            {submitted && (
              <p className="text-green-700 text-center mt-4 font-medium">
                Your message has been sent!
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
