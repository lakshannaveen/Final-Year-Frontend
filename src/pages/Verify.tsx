"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

interface VerifyProps {
  setCurrentView: (view: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Verify({ setCurrentView }: VerifyProps) {
  // Choose primary document type
  const [docType, setDocType] = useState<"nic" | "dl">("nic");

  // NIC inputs
  const [nicFront, setNicFront] = useState<File | null>(null);
  const [nicBack, setNicBack] = useState<File | null>(null);
  const [nicFrontPreview, setNicFrontPreview] = useState("");
  const [nicBackPreview, setNicBackPreview] = useState("");

  // Driving License inputs
  const [dlFront, setDlFront] = useState<File | null>(null);
  const [dlBack, setDlBack] = useState<File | null>(null);
  const [dlFrontPreview, setDlFrontPreview] = useState("");
  const [dlBackPreview, setDlBackPreview] = useState("");

  // Business registration certificate (required) - only one file upload
  const [businessCert, setBusinessCert] = useState<File | null>(null);
  const [businessCertPreview, setBusinessCertPreview] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Refs to revoke object URLs on unmount / replace
  const nicFrontRef = useRef<string | null>(null);
  const nicBackRef = useRef<string | null>(null);
  const dlFrontRef = useRef<string | null>(null);
  const dlBackRef = useRef<string | null>(null);
  const bizRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      [nicFrontRef, nicBackRef, dlFrontRef, dlBackRef, bizRef].forEach((r) => {
        if (r.current) {
          URL.revokeObjectURL(r.current);
          r.current = null;
        }
      });
    };
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void,
    ref: React.MutableRefObject<string | null>
  ) => {
    const file = e.target.files?.[0] ?? null;
    setFile(file);
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
      ref.current = null;
    }
    if (file) {
      const url = URL.createObjectURL(file);
      ref.current = url;
      setPreview(url);
    } else {
      setPreview("");
    }
  };

  const validate = () => {
    setError("");
    // For chosen doc type, require both front and back
    if (docType === "nic") {
      if (!nicFront || !nicBack) {
        setError("Please upload both front and back images/documents of your National ID (NIC).");
        return false;
      }
    } else {
      if (!dlFront || !dlBack) {
        setError("Please upload both front and back images/documents of your Driving License.");
        return false;
      }
    }

    // Business certificate is now required and must be provided
    if (!businessCert) {
      setError("Please upload a Business Registration Certificate (required).");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("docType", docType);

      if (docType === "nic") {
        if (nicFront) formData.append("nicFront", nicFront);
        if (nicBack) formData.append("nicBack", nicBack);
      } else {
        if (dlFront) formData.append("dlFront", dlFront);
        if (dlBack) formData.append("dlBack", dlBack);
      }

      if (businessCert) {
        formData.append("businessCert", businessCert);
      }

      const res = await fetch(`${API_URL}/api/verify`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess("Verification request submitted. We'll review your documents and notify you.");
        // clear inputs and revoke previews
        if (nicFrontRef.current) {
          URL.revokeObjectURL(nicFrontRef.current);
          nicFrontRef.current = null;
        }
        if (nicBackRef.current) {
          URL.revokeObjectURL(nicBackRef.current);
          nicBackRef.current = null;
        }
        if (dlFrontRef.current) {
          URL.revokeObjectURL(dlFrontRef.current);
          dlFrontRef.current = null;
        }
        if (dlBackRef.current) {
          URL.revokeObjectURL(dlBackRef.current);
          dlBackRef.current = null;
        }
        if (bizRef.current) {
          URL.revokeObjectURL(bizRef.current);
          bizRef.current = null;
        }

        setNicFront(null);
        setNicBack(null);
        setNicFrontPreview("");
        setNicBackPreview("");

        setDlFront(null);
        setDlBack(null);
        setDlFrontPreview("");
        setDlBackPreview("");

        setBusinessCert(null);
        setBusinessCertPreview("");

        setTimeout(() => setSuccess(""), 8000);
      } else {
        setError(
          data?.errors?.message ||
            data?.message ||
            "Failed to submit verification. Please try again."
        );
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Network error while submitting verification.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        {/* Top-left back button (matches profile style) */}
        <div className="mb-4 flex items-center">
          <button
            onClick={() => setCurrentView("profile")}
            className="flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors px-3 py-2 rounded-lg hover:bg-green-100"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
          <h1 className="text-2xl font-bold text-green-800 mb-2">Verify Your Account</h1>

          {/* Note block (moved paragraph into a note) */}
          <div role="note" className="mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="font-semibold text-yellow-700 mb-1">Note</p>
              <p className="text-sm text-gray-700">
                Choose one primary identity document (NIC or Driving License). For the selected document you must upload clear front and back images or PDFs.
                You must also upload a Business Registration Certificate (single image/PDF). Files are reviewed manually.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document selector with helpful text */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="docType"
                  value="nic"
                  checked={docType === "nic"}
                  onChange={() => setDocType("nic")}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">National ID (NIC)</div>
                  <div className="text-sm text-gray-800">
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="docType"
                  value="dl"
                  checked={docType === "dl"}
                  onChange={() => setDocType("dl")}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Driving License</div>
                  <div className="text-sm text-gray-800">
                  </div>
                </div>
              </label>
            </div>

            {/* NIC section */}
            {docType === "nic" && (
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">National ID (NIC)</h2>
                <p className="text-sm text-gray-800 mb-3">
                  Upload both front and back images or a PDF. Front/back are required.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">NIC Front (required)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, setNicFront, setNicFrontPreview, nicFrontRef)}
                      className="block text-gray-900 placeholder-gray-500"
                    />
                    {nicFrontPreview && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-800 mb-1">Preview</p>
                        <div className="max-w-xs border rounded overflow-hidden">
                          <img src={nicFrontPreview} alt="NIC front" className="object-contain w-full h-48 bg-gray-50" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">NIC Back (required)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, setNicBack, setNicBackPreview, nicBackRef)}
                      className="block text-gray-900 placeholder-gray-500"
                    />
                    {nicBackPreview && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-800 mb-1">Preview</p>
                        <div className="max-w-xs border rounded overflow-hidden">
                          <img src={nicBackPreview} alt="NIC back" className="object-contain w-full h-48 bg-gray-50" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Driving license section */}
            {docType === "dl" && (
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Driving License</h2>
                <p className="text-sm text-gray-800 mb-3">
                  Upload both front and back images or a PDF. Front/back are required.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">DL Front (required)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, setDlFront, setDlFrontPreview, dlFrontRef)}
                      className="block text-gray-900 placeholder-gray-500"
                    />
                    {dlFrontPreview && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-800 mb-1">Preview</p>
                        <div className="max-w-xs border rounded overflow-hidden">
                          <img src={dlFrontPreview} alt="DL front" className="object-contain w-full h-48 bg-gray-50" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">DL Back (required)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, setDlBack, setDlBackPreview, dlBackRef)}
                      className="block text-gray-900 placeholder-gray-500"
                    />
                    {dlBackPreview && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-800 mb-1">Preview</p>
                        <div className="max-w-xs border rounded overflow-hidden">
                          <img src={dlBackPreview} alt="DL back" className="object-contain w-full h-48 bg-gray-50" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Business registration certificate (required) - only one file */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Business Registration Certificate (required)</h2>
              <p className="text-sm text-gray-800 mb-3">
                Upload one business registration certificate image or PDF. This is required.
              </p>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, setBusinessCert, setBusinessCertPreview, bizRef)}
                className="block text-gray-900 placeholder-gray-500"
              />

              {businessCertPreview && (
                <div className="mt-3">
                  <p className="text-sm text-gray-800 mb-2">Preview</p>
                  <div className="max-w-xs border rounded overflow-hidden">
                    <img src={businessCertPreview} alt="Business cert" className="object-contain w-full h-48 bg-gray-50" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions and messages */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Verification"}
                </button>
              </div>

              <div className="text-right">
                {success && <div className="text-sm text-green-700 font-medium">{success}</div>}
                {error && <div className="text-sm text-red-700 font-medium">{error}</div>}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}