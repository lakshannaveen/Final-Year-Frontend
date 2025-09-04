"use client";

import { useState } from "react";

export default function Register() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" }); // clear error on change
  };

  const validate = () => {
    let valid = true;
    const newErrors = { username: "", email: "", password: "", phone: "" };

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (serviceType === "posting") {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
        valid = false;
      } else if (!/^\d{10,15}$/.test(formData.phone.trim())) {
        newErrors.phone = "Phone number is invalid";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log("Form submitted:", { serviceType, ...formData });
    // Call your API here to save the user
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100 p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
          Register
        </h2>

        {/* Service Type Selector */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setServiceType("finding")}
            className={`px-4 py-2 rounded-l-lg border border-green-700 font-semibold ${
              serviceType === "finding"
                ? "bg-green-700 text-white"
                : "bg-white text-green-700 hover:bg-green-100"
            }`}
          >
            Finding a Service
          </button>
          <button
            onClick={() => setServiceType("posting")}
            className={`px-4 py-2 rounded-r-lg border border-green-700 font-semibold ${
              serviceType === "posting"
                ? "bg-green-700 text-white"
                : "bg-white text-green-700 hover:bg-green-100"
            }`}
          >
            Posting a Service
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-green-700 font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
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
            className="w-full py-2 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 text-white font-semibold hover:from-green-800 hover:to-emerald-800 transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
