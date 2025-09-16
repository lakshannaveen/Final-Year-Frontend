"use client";
import { useState } from "react";
import { useAuth } from "../components/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface SignInProps {
  setCurrentView: (view: string) => void;
}

export default function SignIn({ setCurrentView }: SignInProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    let valid = true;
    const newErrors = { username: "", password: "" };
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setModal(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      
      if (res.ok) {
        setModal({ type: "success", message: "Login successful!" });
        login(data.user);
        setTimeout(() => {
          setCurrentView("home");
        }, 1500);
      } else {
        const errorMsg = data.errors 
          ? Object.values(data.errors).join("\n")
          : "Login failed";
        setModal({ type: "error", message: errorMsg });
        if (data.errors) {
          setErrors({ ...errors, ...data.errors });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setModal({ type: "error", message: `Error connecting to server: ${errorMessage}` });
    }
    
    setLoading(false);
  };

  return (
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
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
          Sign In
        </h2>
        
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
        </form>
        
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
      </div>
    </div>
  );
}