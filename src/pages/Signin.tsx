"use client";
import { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface SignInProps {
  setCurrentView: (view: string) => void;
}

export default function SignIn({ setCurrentView }: SignInProps) {
  const [serviceType, setServiceType] = useState<"" | "serviceSeeker" | "posting">("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    password: "",
    serviceType: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    let valid = true;
    const newErrors = { username: "", password: "", serviceType: "" };

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    }

    if (!serviceType) {
      newErrors.serviceType = "Please select account type";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, serviceType }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful!");
        login(data.user);
        setTimeout(() => {
          setCurrentView("home");
        }, 3000);
      } else {
        const errorMsg = data.errors
          ? Object.values(data.errors).join("\n")
          : "Login failed";
        toast.error(errorMsg);
        if (data.errors) {
          setErrors({ ...errors, ...data.errors });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error connecting to server: ${errorMessage}`);
    }

    setLoading(false);
  };

  // Google OAuth handler: pass serviceType as query param
  const handleGoogleSignIn = () => {
    if (!serviceType) {
      setErrors((prev) => ({ ...prev, serviceType: "Please select account type" }));
      toast.error("Please select account type above!");
      return;
    }
    window.location.href = `${API_URL}/api/auth/google?serviceType=${serviceType}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100 p-6">

      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md z-10">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
          Sign In
        </h2>

        {/* Service Type Selector */}
        {serviceType === "" ? (
          <div className="mb-6 text-center flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setServiceType("serviceSeeker")}
              className="w-full px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md hover:from-green-800 hover:to-emerald-800 transition-all"
            >
              Service Seeker
            </button>
            <button
              type="button"
              onClick={() => setServiceType("posting")}
              className="w-full px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md hover:from-green-800 hover:to-emerald-800 transition-all"
            >
              Service Provider
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center flex justify-center">
              <button
                type="button"
                onClick={() => setServiceType("serviceSeeker")}
                className={`px-4 py-2 rounded-l-lg font-semibold transition-all ${
                  serviceType === "serviceSeeker"
                    ? "bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md"
                    : "bg-white text-green-700 border border-green-700 hover:bg-green-50"
                }`}
              >
                Service Seeker
              </button>
              <button
                type="button"
                onClick={() => setServiceType("posting")}
                className={`px-4 py-2 rounded-r-lg font-semibold transition-all ${
                  serviceType === "posting"
                    ? "bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md"
                    : "bg-white text-green-700 border border-green-700 hover:bg-green-50"
                }`}
              >
                Service Provider
              </button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Username */}
              <div className="mb-4">
                <label className="block text-green-700 font-semibold mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  placeholder="Enter username"
                  style={{ color: "black" }}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.username
                      ? "border-red-500 focus:ring-red-300"
                      : "border-green-300 focus:ring-green-300"
                  }`}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="block text-green-700 font-semibold mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  placeholder="Enter password"
                  style={{ color: "black" }}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-300"
                      : "border-green-300 focus:ring-green-300"
                  }`}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 text-white font-semibold hover:from-green-800 hover:to-emerald-800 shadow-md transition disabled:opacity-70"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              {/* Continue as Guest */}
              <button
                type="button"
                onClick={() => setCurrentView("home")}
                className="w-full py-2 mt-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 shadow-md transition"
              >
                Continue as Guest
              </button>
            </form>

            {/* Or divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow h-px bg-gray-300" />
              <span className="px-2 text-gray-500 font-semibold">OR</span>
              <div className="flex-grow h-px bg-gray-300" />
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-white to-white border-2 border-gray-200 flex items-center justify-center gap-2 text-gray-700 font-semibold hover:bg-gray-50 shadow transition"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="inline-block"
              >
                {/* SVG paths as before */}
                <path
                  d="M44.5 20H24V28.5H35.8C34.3 33.1 29.8 36 24 36C16.8 36 10.5 29.7 10.5 22.5C10.5 15.3 16.8 9 24 9C27.1 9 30 10.1 32.2 12.2L37.5 7.5C34.1 4.3 29.3 2 24 2C12.4 2 3 11.4 3 23C3 34.6 12.4 44 24 44C35.6 44 45 34.6 45 23C45 21.3 44.8 20.6 44.5 20Z"
                  fill="#FFC107"
                />
                           <path
                  d="M6.3 14.7L12.1 19.2C13.7 15.6 18.4 12.7 24 12.7C27.2 12.7 30.1 13.9 32.2 16.1L37.6 11.7C34.2 8.3 29.4 6 24 6C16.7 6 10.5 12.2 10.5 19.5C10.5 22.5 12.1 25.1 14.3 26.9L20.1 22.4C19.1 21.7 18.1 19.8 18.1 17.7C18.1 15.6 19.1 13.7 20.1 12.7Z"
                  fill="#FF3D00"
                />
                <path
                  d="M24 44C29.3 44 34.1 41.7 37.5 38.5L32.2 33.8C30.1 35.9 27.2 37.1 24 37.1C18.4 37.1 13.7 34.2 12.1 30.6L6.3 35.1C10.5 41.7 16.7 44 24 44Z"
                  fill="#4CAF50"
                />
                <path
                  d="M44.5 20H24V28.5H35.8C34.5 32.1 31.4 34.7 27.8 34.7C25.9 34.7 24.2 34.1 22.8 33.1L17.6 38.5C20.5 41.1 24 44 24 44C35.6 44 45 34.6 45 23C45 21.3 44.8 20.6 44.5 20Z"
                  fill="#1976D2"
                />
                {/* ...other paths */}
              </svg>
              <span>Sign In with Google</span>
            </button>

            {/* Link to Register */}
            <p className="mt-4 text-center text-green-700">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setCurrentView("register")}
                className="font-semibold underline hover:text-green-900 transition"
              >
                Register here
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}