"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";

interface VerifyProps {
  setCurrentView: (view: string) => void;
}

interface VerificationStatus {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  docType: 'nic' | 'dl';
  submittedAt: string;
  reviewedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Verify({ setCurrentView }: VerifyProps) {
  const [docType, setDocType] = useState<"nic" | "dl">("nic");
  const [nicFront, setNicFront] = useState<File | null>(null);
  const [nicBack, setNicBack] = useState<File | null>(null);
  const [nicFrontPreview, setNicFrontPreview] = useState("");
  const [nicBackPreview, setNicBackPreview] = useState("");
  const [dlFront, setDlFront] = useState<File | null>(null);
  const [dlBack, setDlBack] = useState<File | null>(null);
  const [dlFrontPreview, setDlFrontPreview] = useState("");
  const [dlBackPreview, setDlBackPreview] = useState("");
  const [businessCert, setBusinessCert] = useState<File | null>(null);
  const [businessCertPreview, setBusinessCertPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const nicFrontRef = useRef<string | null>(null);
  const nicBackRef = useRef<string | null>(null);
  const dlFrontRef = useRef<string | null>(null);
  const dlBackRef = useRef<string | null>(null);
  const bizRef = useRef<string | null>(null);

  // Fetch verification status on component mount
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/verify/status`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setVerification(data.verification);
        }
        // If 404, no verification exists - that's fine
      } catch (error) {
        console.error("Error fetching verification status:", error);
      }
      setLoading(false);
    };

    fetchVerificationStatus();

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

    // Business certificate is required
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
    setShowSuccessModal(false);

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

      console.log('Submitting verification...');

      const res = await fetch(`${API_URL}/api/verify/submit`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        setSuccess("Verification request submitted successfully! We'll review your documents and notify you.");
        setShowSuccessModal(true);

        // Clear all inputs and revoke previews
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

        // Fetch updated verification status
        const statusRes = await fetch(`${API_URL}/api/verify/status`, {
          method: "GET",
          credentials: "include",
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setVerification(statusData.verification);
        }

        // keep the inline success message for a short time but let the user close the modal
        setTimeout(() => setSuccess(""), 8000);
      } else {
        console.error('Verification submission failed:', data);
        setError(
          data?.errors?.message ||
            data?.message ||
            "Failed to submit verification. Please try again."
        );
      }
    } catch (err: unknown) {
      console.error('Verification submission error:', err);
      setError((err as Error)?.message || "Network error while submitting verification.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // Get verification status display
  const getVerificationStatusDisplay = () => {
    if (loading) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400 mr-2"></div>
            <p className="text-blue-700">Loading verification status...</p>
          </div>
        </div>
      );
    }

    if (verification) {
      switch (verification.status) {
        case 'pending':
          return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
              <div className="flex items-center">
                <Clock className="text-yellow-600 mr-2" size={20} />
                <div>
                  <p className="font-semibold text-yellow-700">Verification Pending</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Your verification request is under review. This usually takes 24-48 hours.
                    Submitted on {new Date(verification.submittedAt).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            </div>
          );
        case 'approved':
          return (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-6">
              <div className="flex items-center">
                <CheckCircle className="text-green-600 mr-2" size={20} />
                <div>
                  <p className="font-semibold text-green-700">Account Verified</p>
                  <p className="text-sm text-green-600 mt-1">
                    Your account has been verified! You now have a verified badge on your profile.
                    {verification.reviewedAt && ` Approved on ${new Date(verification.reviewedAt).toLocaleDateString()}.`}
                  </p>
                </div>
              </div>
            </div>
          );
        case 'rejected':
          return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6">
              <div className="flex items-center">
                <XCircle className="text-red-600 mr-2" size={20} />
                <div>
                  <p className="font-semibold text-red-700">Verification Rejected</p>
                  <p className="text-sm text-red-600 mt-1">
                    Your verification request was rejected. Please check your documents and submit again.
                    {verification.reviewedAt && ` Rejected on ${new Date(verification.reviewedAt).toLocaleDateString()}.`}
                  </p>
                </div>
              </div>
            </div>
          );
        default:
          return null;
      }
    }

    return null;
  };

  // If verification is approved, show success message and don't allow resubmission
  if (verification?.status === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-4 flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <div className="mb-4 flex items-center">
            <button
              onClick={() => setCurrentView("profile")}
              className="flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors px-3 py-2 rounded-lg hover:bg-green-100"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Profile
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-4">Account Verified</h1>
            <p className="text-gray-700 mb-6">
              Your account has been successfully verified! You now have a verified badge on your profile
              which helps build trust with customers.
            </p>
            <button
              onClick={() => setCurrentView("profile")}
              className="px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Return to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        {/* Top-left back button */}
        <div className="mb-4 flex items-center">
          <button
            onClick={() => setCurrentView("profile")}
            className="flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors px-3 py-2 rounded-lg hover:bg-green-100"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Profile
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
          <h1 className="text-2xl font-bold text-green-800 mb-2">Verify Your Account</h1>

          {/* Show current verification status */}
          {getVerificationStatusDisplay()}

          {/* Note block */}
          <div role="note" className="mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="font-semibold text-yellow-700 mb-1">Note</p>
              <p className="text-sm text-gray-700">
                Choose one primary identity document (NIC or Driving License). For the selected document you must upload clear front and back images or PDFs.
                You must also upload a Business Registration Certificate (single image/PDF). Files are reviewed manually.
              </p>
            </div>
          </div>

          {/* Only show form if no pending verification or if rejected */}
          {(!verification || verification.status === 'rejected') ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document selector */}
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
                      Upload front and back of your NIC
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
                      Upload front and back of your Driving License
                    </div>
                  </div>
                </label>
              </div>

              {/* NIC section */}
              {docType === "nic" && (
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">National ID (NIC)</h2>
                  <p className="text-sm text-gray-800 mb-3">
                    Upload both front and back images or PDF. Front/back are required.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">NIC Front (required)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, setNicFront, setNicFrontPreview, nicFrontRef)}
                        className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
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
                        className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
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
                    Upload both front and back images or PDF. Front/back are required.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">DL Front (required)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, setDlFront, setDlFrontPreview, dlFrontRef)}
                        className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
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
                        className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
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

              {/* Business registration certificate */}
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Business Registration Certificate (required)</h2>
                <p className="text-sm text-gray-800 mb-3">
                  Upload one business registration certificate image or PDF. This is required.
                </p>

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange(e, setBusinessCert, setBusinessCertPreview, bizRef)}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
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
                    className="px-5 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60 flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      "Submit Verification"
                    )}
                  </button>
                </div>

                <div className="text-right">
                  {success && (
                    <div className="text-sm text-green-700 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="text-sm text-red-700 font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </form>
          ) : (
            // Show message if verification is pending
            <div className="text-center py-8">
              <p className="text-gray-700 mb-4">
                Your verification request is currently being reviewed. Please check back later for updates.
              </p>
              <button
                onClick={() => setCurrentView("profile")}
                className="px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
              >
                Return to Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal (similar to Feedback modal) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg text-center relative">
            <h3 className="font-bold text-lg mb-2 text-green-600">Verification Submitted</h3>
            <p className="text-black mb-3">
              Thank you — your verification request has been received.
            </p>
            <p className="text-sm text-gray-700 mb-4">
              We&apos;ll review your documents within 24 hours and will notify you with an update about the outcome. Please keep an eye on your notifications or email.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 font-semibold"
                onClick={closeSuccessModal}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}