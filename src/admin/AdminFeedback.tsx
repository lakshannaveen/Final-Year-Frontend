"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, Star, Search, RefreshCw, Trash2, Eye, EyeOff, CheckCircle, Clock } from "lucide-react";

interface Feedback {
  _id: string;
  message: string;
  rating: number;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  user: {
    username: string;
    profilePic: string;
    email: string;
  };
}

interface FeedbackStats {
  total: number;
  averageRating: number;
  pending: number;
  reviewed: number;
  resolved: number;
}

interface Props {
  setCurrentView: (view: string) => void;
}

type Filters = {
  status: '' | 'pending' | 'reviewed' | 'resolved';
  search: string;
  page: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminFeedback({ setCurrentView }: Props) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    search: '',
    page: 1
  });

  // New state: shows the green "Back to Dashboard" text to the right under the Refresh button after a successful refresh
  const [showBackText, setShowBackText] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', '10');

      const response = await fetch(`${API_URL}/api/feedback/admin/feedbacks?${queryParams}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      alert('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.page, filters.search]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/feedback/admin/stats`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [fetchFeedbacks, fetchStats]);

  const updateStatus = async (feedbackId: string, status: 'pending' | 'reviewed' | 'resolved') => {
    try {
      setUpdating(feedbackId);
      const response = await fetch(`${API_URL}/api/feedback/admin/${feedbackId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setFeedbacks(prev => 
        prev.map(fb => 
          fb._id === feedbackId ? { ...fb, status } : fb
        )
      );
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      setDeleting(feedbackId);
      const response = await fetch(`${API_URL}/api/feedback/admin/${feedbackId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete feedback');
      }

      // Remove from local state
      setFeedbacks(prev => prev.filter(fb => fb._id !== feedbackId));
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'reviewed': return <Eye size={16} />;
      case 'resolved': return <CheckCircle size={16} />;
      default: return <EyeOff size={16} />;
    }
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

  // New handler to refresh feedbacks and stats, and show the green "Back to Dashboard" text on success
  const handleRefresh = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchFeedbacks(), fetchStats()]);
      // Show green "Back to Dashboard" text on the right under the refresh button
      setShowBackText(true);
      // Hide after 5 seconds
      setTimeout(() => setShowBackText(false), 5000);
    } catch (err) {
      console.error('Refresh failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: consider external any URL starting with http(s) as external
  const isExternalUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Modern dropdown state/refs for Status filter
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const statusLabel = filters.status === '' ? 'All Status' : filters.status.charAt(0).toUpperCase() + filters.status.slice(1);

  const setStatusFilter = (val: Filters['status']) => {
    setFilters({ ...filters, status: val, page: 1 });
    setStatusOpen(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView("admindashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-blue-900">Admin - Feedbacks</h1>
          </div>

          {/* Right side: Refresh button and the conditional green Back to Dashboard text under it */}
          <div className="flex flex-col items-end">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            {/* This green text appears only after a successful refresh and is placed below the Refresh button on the right side.
                It is clickable and will navigate back to the dashboard when clicked. It will auto-hide after a short time. */}
            {showBackText && (
              <button
                onClick={() => setCurrentView("admindashboard")}
                className="mt-2 text-green-700 hover:text-green-800 text-sm font-semibold bg-green-50 px-2 py-1 rounded transition cursor-pointer"
                title="Back to Dashboard"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
              <div className="text-sm text-gray-600">Reviewed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search feedbacks..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-700"
                />
              </div>
            </div>

            {/* Modern dropdown replacing the <select>. Kept placement and behavior (sets filters.status and resets page). */}
            <div ref={statusRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>

              <button
                type="button"
                onClick={() => setStatusOpen(v => !v)}
                className="w-48 flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                aria-haspopup="true"
                aria-expanded={statusOpen}
              >
                <span className="truncate">{statusLabel}</span>
                <span className="ml-2 text-gray-400 select-none">▾</span>
              </button>

              {statusOpen && (
                <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <li
                    onClick={() => setStatusFilter('')}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${filters.status === '' ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'}`}
                  >
                    All Status
                  </li>
                  <li
                    onClick={() => setStatusFilter('pending')}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${filters.status === 'pending' ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'}`}
                  >
                    Pending
                  </li>
                  <li
                    onClick={() => setStatusFilter('reviewed')}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${filters.status === 'reviewed' ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'}`}
                  >
                    Reviewed
                  </li>
                  <li
                    onClick={() => setStatusFilter('resolved')}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${filters.status === 'resolved' ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'}`}
                  >
                    Resolved
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Feedbacks List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <RefreshCw size={32} className="animate-spin text-blue-600" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No feedbacks found.
            </div>
          ) : (
            <div className="divide-y">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* User Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 relative rounded-full overflow-hidden">
                        {(() => {
                          const src = feedback.user.profilePic || '/default-avatar.png';
                          if (isExternalUrl(src)) {
                            // External host: use plain <img> to avoid next/image hostname config runtime error.
                            // eslint-disable-next-line @next/next/no-img-element
                            return (
                              <img
                                src={src}
                                alt={feedback.user.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            );
                          }
                          // Local/internal path: use next/image for optimization
                          return (
                            <Image
                              src={src}
                              alt={feedback.user.username}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                            />
                          );
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {feedback.user.username}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {feedback.user.email}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{feedback.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                              />
                            ))}
                          </div>
                          <span>{formatDate(feedback.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Status Badge and Controls */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(feedback.status)}`}>
                          {getStatusIcon(feedback.status)}
                          {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                        </span>
                        
                        {/* Status Buttons */}
                        <div className="flex gap-1">
                          {feedback.status !== 'pending' && (
                            <button
                              onClick={() => updateStatus(feedback._id, 'pending')}
                              disabled={updating === feedback._id}
                              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition disabled:opacity-50"
                            >
                              {updating === feedback._id ? '...' : 'Pending'}
                            </button>
                          )}
                          {feedback.status !== 'reviewed' && (
                            <button
                              onClick={() => updateStatus(feedback._id, 'reviewed')}
                              disabled={updating === feedback._id}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition disabled:opacity-50"
                            >
                              {updating === feedback._id ? '...' : 'Review'}
                            </button>
                          )}
                          {feedback.status !== 'resolved' && (
                            <button
                              onClick={() => updateStatus(feedback._id, 'resolved')}
                              disabled={updating === feedback._id}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition disabled:opacity-50"
                            >
                              {updating === feedback._id ? '...' : 'Resolve'}
                            </button>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteFeedback(feedback._id)}
                          disabled={deleting === feedback._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                          title="Delete feedback"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {feedbacks.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-green-50 disabled:opacity-80 disabled:cursor-not-allowed text-blue-700"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-blue-700">
              Page {filters.page}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 text-blue-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}