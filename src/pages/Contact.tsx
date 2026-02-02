"use client";
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

interface ContactProps {
  setCurrentView: (view: string) => void;
}

interface Errors {
  name: string;
  email: string;
  message: string;
  phone: string;
  submit: string;
}

export default function Contact({ setCurrentView }: ContactProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    phone: ""
  });
  const [errors, setErrors] = useState<Errors>({
    name: "",
    email: "",
    message: "",
    phone: "",
    submit: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    const newErrors: Errors = { name: "", email: "", message: "", phone: "", submit: "" };

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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    // Message validation
    const trimmed = formData.message.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    if (!trimmed) {
      newErrors.message = "Message is required";
      valid = false;
    } else if (wordCount < 2) {
      newErrors.message = "Message must be at least 2 words";
      valid = false;
    } else if (wordCount > 50) {
      newErrors.message = "Message must not exceed 50 words";
      valid = false;
    }

    // Phone validation (optional)
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // clear previous submit error
    setErrors(prev => ({ ...prev, submit: "" }));

    if (!validate()) return;

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_URL}/api/contact/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        // try to parse server error
        const errorData = await response.json().catch(() => ({} as { error?: string }));
        throw new Error(errorData?.error || "Failed to submit contact form");
      }

      const data = await response.json();
      console.log("Contact submitted:", data);

      setSubmitted(true);
      setFormData({ name: "", email: "", message: "", phone: "" });
      // clear field-level errors
      setErrors({ name: "", email: "", message: "", phone: "", submit: "" });
    } catch (err: unknown) {
      console.error("Submit error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setErrors(prev => ({ ...prev, submit: message }));
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSubmitted(false);
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
            Have questions or need assistance? Reach out to us and we&apos;ll respond promptly.
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
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors(prev => ({ ...prev, name: "" }));
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

            {/* Email */}
            <div className="mb-4">
              <label className="block text-green-700 font-semibold mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors(prev => ({ ...prev, email: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.email
                    ? "border-red-500 focus:ring-red-300"
                    : "border-green-300 focus:ring-green-300"
                } text-gray-800 placeholder-gray-400`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div className="mb-4">
              <label className="block text-green-700 font-semibold mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  setErrors(prev => ({ ...prev, phone: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.phone
                    ? "border-red-500 focus:ring-red-300"
                    : "border-green-300 focus:ring-green-300"
                } text-gray-800 placeholder-gray-400`}
                placeholder="+94 123 456 789"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-green-700 font-semibold mb-1">
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  setErrors(prev => ({ ...prev, message: "" }));
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
              disabled={loading}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 text-white font-semibold hover:from-green-800 hover:to-emerald-800 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>

            {errors.submit && (
              <p className="text-red-500 text-center mt-4 font-medium">
                {errors.submit}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Success Modal (similar to Feedback component) */}
      {submitted && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg text-center relative">
            <h3 className="font-bold text-lg mb-2 text-green-600">Success</h3>
            <p className="text-black mb-4">Your message has been sent successfully! We will get back to you shortly.</p>
            <button
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 font-semibold"
              onClick={closeModal}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}