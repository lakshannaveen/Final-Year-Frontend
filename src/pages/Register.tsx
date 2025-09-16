"use client";
import { useState } from "react";
import { useAuth } from "../components/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface RegisterProps {
  setCurrentView: (view: string) => void;
}

export default function Register({ setCurrentView }: RegisterProps) {
  const [serviceType, setServiceType] = useState<"finding" | "posting">("finding");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
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
    const newErrors = { username: "", email: "", password: "", phone: "" };
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    } else if (formData.username.length > 10) {
      newErrors.username = "Username must not exceed 10 characters";
      valid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must be 8+ chars, include uppercase, lowercase, number & special char";
      valid = false;
    }
    
    if (serviceType === "posting") {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
        valid = false;
      } else if (!/^07\d{8}$/.test(formData.phone.trim())) {
        newErrors.phone = "Phone must be a valid Sri Lankan number (e.g. 0712345678)";
        valid = false;
      }
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
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, serviceType }),
        credentials: "include",
      });

      const data = await res.json();
      
      if (res.ok) {
        setModal({ type: "success", message: "Registration successful!" });
        setFormData({ username: "", email: "", password: "", phone: "" });
        login(data.user);
        setTimeout(() => {
          setCurrentView("home");
        }, 1500);
      } else {
        const errorMsg = data.errors 
          ? Object.values(data.errors).join("\n")
          : "Registration failed";
        setModal({ type: "error", message: errorMsg });
        if (data.errors) {
          setErrors({ ...errors, ...data.errors });
        }
      }
    } catch (err) {
      setModal({ type: "error", message: "Error connecting to server." });
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
          Register
        </h2>
        
        {/* Service Type Selector */}
        <div className="mb-6 text-center flex justify-center">
          <button
            type="button"
            onClick={() => setServiceType("finding")}
            className={`px-4 py-2 rounded-l-lg font-semibold transition-all ${
              serviceType === "finding"
                ? "bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md"
                : "bg-white text-green-700 border border-green-700 hover:bg-green-50"
            }`}
          >
            Finding a Service
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
            Posting a Service
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
          
          {/* Email */}
          <div className="mb-4">
            <label className="block text-green-700 font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="Enter email"
              style={{ color: "black" }}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-500 focus:ring-red-300"
                  : "border-green-300 focus:ring-green-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          
          {/* Password */}
          <div className="mb-4">
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
          
          {/* Phone (only for posting a service) */}
          {serviceType === "posting" && (
            <div className="mb-6">
              <label className="block text-green-700 font-semibold mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                placeholder="0712345678"
                style={{ color: "black" }}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.phone
                    ? "border-red-500 focus:ring-red-300"
                    : "border-green-300 focus:ring-green-300"
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          )}
          
          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 text-white font-semibold hover:from-green-800 hover:to-emerald-800 shadow-md transition disabled:opacity-70"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        
        {/* Link to Sign In */}
        <p className="mt-4 text-center text-green-700">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setCurrentView("signin")}
            className="font-semibold underline hover:text-green-900 transition"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}