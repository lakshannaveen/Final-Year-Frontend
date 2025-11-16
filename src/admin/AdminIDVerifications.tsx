"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, CheckCircle, XCircle, Clock, Eye, User, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

type Props = {
  setCurrentView: (view: string) => void;
};

interface Verification {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    serviceType: string;
    profilePic?: string;
  };
  docType: 'nic' | 'dl';
  status: 'pending' | 'approved' | 'rejected';
  nicFront: string;
  nicBack: string;
  dlFront: string;
  dlBack: string;
  businessCert: string;
  submittedAt: string;
  reviewedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminIDVerifications({ setCurrentView }: Props) {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [imageZoom, setImageZoom] = useState<{ [key: string]: number }>({});
  const [imageRotation, setImageRotation] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/verify/all`);
      const data = await res.json();
      if (res.ok) {
        setVerifications(data.verifications || []);
      } else {
        console.error('Failed to fetch verifications:', data);
        alert('Failed to load verification requests');
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
      alert('Error loading verification requests');
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (verificationId: string, status: 'approved' | 'rejected') => {
    setUpdating(verificationId);
    try {
      const res = await fetch(`${API_URL}/api/verify/${verificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (res.ok) {
        // Update local state
        setVerifications(prev => 
          prev.map(v => 
            v._id === verificationId 
              ? { ...v, status, reviewedAt: new Date().toISOString() }
              : v
          )
        );
        if (selectedVerification?._id === verificationId) {
          setSelectedVerification(prev => prev ? { ...prev, status, reviewedAt: new Date().toISOString() } : null);
        }
        alert(`Verification ${status} successfully!`);
      } else {
        console.error('Failed to update verification:', data);
        alert('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Error updating verification status');
    } finally {
      setUpdating(null);
    }
  };

  const openVerificationDetails = async (verification: Verification) => {
    try {
      // Fetch full verification details with file URLs
      const res = await fetch(`${API_URL}/api/verify/${verification._id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedVerification(data.verification);
        setShowModal(true);
        
        // Initialize zoom and rotation for all images
        const imageKeys = ['nicFront', 'nicBack', 'dlFront', 'dlBack', 'businessCert'];
        const initialZoom: { [key: string]: number } = {};
        const initialRotation: { [key: string]: number } = {};
        imageKeys.forEach(key => {
          initialZoom[key] = 1;
          initialRotation[key] = 0;
        });
        setImageZoom(initialZoom);
        setImageRotation(initialRotation);
      } else {
        console.error('Failed to fetch verification details:', data);
        alert('Failed to load verification details');
      }
    } catch (error) {
      console.error('Error fetching verification details:', error);
      alert('Error loading verification details');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVerification(null);
    setImageZoom({});
    setImageRotation({});
  };

  const handleImageLoad = (imageKey: string) => {
    setImageLoading(prev => ({ ...prev, [imageKey]: false }));
  };

  const handleImageError = (imageKey: string) => {
    setImageLoading(prev => ({ ...prev, [imageKey]: false }));
    console.error(`Failed to load image: ${imageKey}`);
  };

  const zoomImage = (imageKey: string, direction: 'in' | 'out') => {
    setImageZoom(prev => ({
      ...prev,
      [imageKey]: direction === 'in' 
        ? Math.min((prev[imageKey] || 1) + 0.5, 3)
        : Math.max((prev[imageKey] || 1) - 0.5, 0.5)
    }));
  };

  const rotateImage = (imageKey: string) => {
    setImageRotation(prev => ({
      ...prev,
      [imageKey]: ((prev[imageKey] || 0) + 90) % 360
    }));
  };

  const resetImage = (imageKey: string) => {
    setImageZoom(prev => ({ ...prev, [imageKey]: 1 }));
    setImageRotation(prev => ({ ...prev, [imageKey]: 0 }));
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image');
    }
  };

  // Filter verifications based on search and status
  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || verification.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={16} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return "bg-green-100 text-green-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDocTypeDisplay = (docType: string) => {
    return docType === 'nic' ? 'National ID (NIC)' : 'Driving License';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-blue-900">Admin - ID Verifications</h1>
            <button
              onClick={() => setCurrentView("admindashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </header>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-blue-900">Admin - ID Verifications</h1>
          <button
            onClick={() => setCurrentView("admindashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{verifications.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {verifications.filter(v => v.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {verifications.filter(v => v.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">
              {verifications.filter(v => v.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Verification List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredVerifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No verification requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVerifications.map((verification) => (
                    <tr key={verification._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {verification.user.profilePic ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={verification.user.profilePic}
                                alt={verification.user.username}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="text-blue-600" size={20} />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {verification.user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {verification.user.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {verification.user.serviceType === 'posting' ? 'Service Provider' : 'Service Seeker'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getDocTypeDisplay(verification.docType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(verification.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(verification.status)}`}>
                            {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                          </span>
                        </div>
                        {verification.reviewedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Reviewed: {formatDate(verification.reviewedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(verification.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openVerificationDetails(verification)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                          >
                            <Eye size={14} />
                            View Docs
                          </button>
                          {verification.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateVerificationStatus(verification._id, 'approved')}
                                disabled={updating === verification._id}
                                className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition disabled:opacity-50"
                              >
                                {updating === verification._id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700"></div>
                                ) : (
                                  <CheckCircle size={14} />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => updateVerificationStatus(verification._id, 'rejected')}
                                disabled={updating === verification._id}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                              >
                                {updating === verification._id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700"></div>
                                ) : (
                                  <XCircle size={14} />
                                )}
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification Details Modal */}
        {showModal && selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Verification Details - {selectedVerification.user.username}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 block">Username</label>
                      <p className="font-medium">{selectedVerification.user.username}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block">Email</label>
                      <p className="font-medium">{selectedVerification.user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block">Service Type</label>
                      <p className="font-medium capitalize">{selectedVerification.user.serviceType}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block">Status</label>
                      <div className="flex items-center">
                        {getStatusIcon(selectedVerification.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedVerification.status)}`}>
                          {selectedVerification.status.charAt(0).toUpperCase() + selectedVerification.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 block">Submitted</label>
                      <p className="text-sm">{formatDate(selectedVerification.submittedAt)}</p>
                    </div>
                    {selectedVerification.reviewedAt && (
                      <div>
                        <label className="text-sm text-gray-600 block">Reviewed</label>
                        <p className="text-sm">{formatDate(selectedVerification.reviewedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Images */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* ID Documents */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">
                        {selectedVerification.docType === 'nic' ? 'National ID (NIC)' : 'Driving License'}
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {/* Front Side */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Front Side</label>
                          <button
                            onClick={() => downloadImage(
                              selectedVerification.docType === 'nic' ? selectedVerification.nicFront : selectedVerification.dlFront,
                              `${selectedVerification.user.username}_front.jpg`
                            )}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                          >
                            <Download size={12} />
                            Download
                          </button>
                        </div>
                        <div className="border rounded-lg overflow-hidden bg-gray-100 relative">
                          {imageLoading[selectedVerification.docType + 'Front'] !== false && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                          <img
                            src={selectedVerification.docType === 'nic' ? selectedVerification.nicFront : selectedVerification.dlFront}
                            alt="Document Front"
                            className={`w-full h-64 object-contain transition-transform duration-200 ${
                              imageLoading[selectedVerification.docType + 'Front'] !== false ? 'opacity-0' : 'opacity-100'
                            }`}
                            style={{
                              transform: `scale(${imageZoom[selectedVerification.docType + 'Front'] || 1}) rotate(${imageRotation[selectedVerification.docType + 'Front'] || 0}deg)`
                            }}
                            onLoad={() => handleImageLoad(selectedVerification.docType + 'Front')}
                            onError={() => handleImageError(selectedVerification.docType + 'Front')}
                          />
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            <button
                              onClick={() => zoomImage(selectedVerification.docType + 'Front', 'out')}
                              className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                            >
                              <ZoomOut size={16} />
                            </button>
                            <button
                              onClick={() => zoomImage(selectedVerification.docType + 'Front', 'in')}
                              className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                            >
                              <ZoomIn size={16} />
                            </button>
                            <button
                              onClick={() => rotateImage(selectedVerification.docType + 'Front')}
                              className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button
                              onClick={() => resetImage(selectedVerification.docType + 'Front')}
                              className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Back Side */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Back Side</label>
                          <button
                            onClick={() => downloadImage(
                              selectedVerification.docType === 'nic' ? selectedVerification.nicBack : selectedVerification.dlBack,
                              `${selectedVerification.user.username}_back.jpg`
                            )}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                          >
                            <Download size={12} />
                            Download
                          </button>
                        </div>
                        <div className="border rounded-lg overflow-hidden bg-gray-100 relative">
                          {imageLoading[selectedVerification.docType + 'Back'] !== false && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                          <img
                            src={selectedVerification.docType === 'nic' ? selectedVerification.nicBack : selectedVerification.dlBack}
                            alt="Document Back"
                            className={`w-full h-64 object-contain transition-transform duration-200 ${
                              imageLoading[selectedVerification.docType + 'Back'] !== false ? 'opacity-0' : 'opacity-100'
                            }`}
                            style={{
                              transform: `scale(${imageZoom[selectedVerification.docType + 'Back'] || 1}) rotate(${imageRotation[selectedVerification.docType + 'Back'] || 0}deg)`
                            }}
                            onLoad={() => handleImageLoad(selectedVerification.docType + 'Back')}
                            onError={() => handleImageError(selectedVerification.docType + 'Back')}
                          />
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            <button
                              onClick={() => zoomImage(selectedVerification.docType + 'Back', 'out')}
                              className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                            >
                              <ZoomOut size={16} />
                            </button>
                            <button
                              onClick={() => zoomImage(selectedVerification.docType + 'Back', 'in')}
                              className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                            >
                              <ZoomIn size={16} />
                            </button>
                            <button
                              onClick={() => rotateImage(selectedVerification.docType + 'Back')}
                              className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button
                              onClick={() => resetImage(selectedVerification.docType + 'Back')}
                              className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Certificate */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">Business Registration Certificate</h3>
                      <button
                        onClick={() => downloadImage(
                          selectedVerification.businessCert,
                          `${selectedVerification.user.username}_business_certificate.jpg`
                        )}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden bg-gray-100 relative">
                      {imageLoading.businessCert !== false && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      <img
                        src={selectedVerification.businessCert}
                        alt="Business Certificate"
                        className={`w-full h-[512px] object-contain transition-transform duration-200 ${
                          imageLoading.businessCert !== false ? 'opacity-0' : 'opacity-100'
                        }`}
                        style={{
                          transform: `scale(${imageZoom.businessCert || 1}) rotate(${imageRotation.businessCert || 0}deg)`
                        }}
                        onLoad={() => handleImageLoad('businessCert')}
                        onError={() => handleImageError('businessCert')}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={() => zoomImage('businessCert', 'out')}
                          className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                        >
                          <ZoomOut size={16} />
                        </button>
                        <button
                          onClick={() => zoomImage('businessCert', 'in')}
                          className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                        >
                          <ZoomIn size={16} />
                        </button>
                        <button
                          onClick={() => rotateImage('businessCert')}
                          className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          onClick={() => resetImage('businessCert')}
                          className="p-1 bg-white rounded shadow hover:bg-gray-100 transition"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedVerification.status === 'pending' && (
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      onClick={() => updateVerificationStatus(selectedVerification._id, 'rejected')}
                      disabled={updating === selectedVerification._id}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {updating === selectedVerification._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject Verification
                    </button>
                    <button
                      onClick={() => updateVerificationStatus(selectedVerification._id, 'approved')}
                      disabled={updating === selectedVerification._id}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {updating === selectedVerification._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve Verification
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}