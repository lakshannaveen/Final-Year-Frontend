"use client";
import React, { useState } from "react";
import { toast } from 'react-toastify';

type AdminLoginProps = {
  setCurrentView: (view: string) => void;
};

export default function AdminLogin({ setCurrentView }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";
  const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "admin";

  // Username: min 5 chars, only letters
  const validateUsername = (value: string) => {
    const regex = /^[A-Za-z]{5,}$/;
    return regex.test(value);
  };

  // Password: 8 chars, upper, lower, number, special
  const validatePassword = (value: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateUsername(username)) {
      setError("Username must be at least 5 characters and letters only.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must include 8 characters with uppercase, lowercase, number & special character."
      );
      return;
    }

    setLoading(true);

    try {
      if (!PUBLIC_KEY) {
        setError("Admin key is not configured in .env.");
        setLoading(false);
        return;
      }

      // Exact match required for both username and password (case-sensitive)
      if (username === ADMIN_USERNAME && password === PUBLIC_KEY) {
        sessionStorage.setItem("isAdmin", "1");
        toast.success("Login successful!");

        setTimeout(() => {
          setCurrentView("admindashboard");
        }, 600);
      } else {
        setError("Invalid username or password.");
      }
    } catch {
      setError("Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-white p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-blue-50 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-blue-600"
            >
              <rect width="24" height="24" rx="6" fill="#E8F1FF" />
              <path
                d="M12 7V12L15 14"
                stroke="#0b67ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-slate-900 text-lg font-semibold">Admin Login</h2>
            <p className="text-blue-600 text-sm">Secure admin access </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              placeholder="Enter username"
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-blue-100 bg-blue-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-blue-100 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Alerts */}
          {error && (
            <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className={
                "w-full py-3 rounded-md text-white font-semibold " +
                (loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700")
              }
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("home")}
              className="w-full py-3 rounded-md text-blue-600 font-semibold border border-blue-100 hover:bg-blue-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}