"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";

type Props = {
  setCurrentView: (view: string) => void;
};

type User = {
  _id: string;
  username?: string;
  email: string;
  phone?: string;
  website?: string;
  serviceType: "serviceSeeker" | "posting";
  bio: string;
  status: string;
  createdAt: string;
  profilePic?: string;
  coverImage?: string;
  googleId?: string;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type UserStats = {
  totalUsers: number;
  serviceSeekerCount: number;
  postingCount: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
};

export default function AdminUsers({ setCurrentView }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    website: "",
    bio: "",
    status: ""
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // New states for success modals
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState("");

  // API base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Refs for modal overlays to support click-outside-to-close
  const editOverlayRef = useRef<HTMLDivElement | null>(null);
  const deleteOverlayRef = useRef<HTMLDivElement | null>(null);
  const deleteSuccessOverlayRef = useRef<HTMLDivElement | null>(null);
  const updateSuccessOverlayRef = useRef<HTMLDivElement | null>(null);

  // Safe username getter
  const getUsernameInitial = (user: User) => {
    if (!user.username || user.username.trim() === "") {
      return user.email?.charAt(0)?.toUpperCase() || "U";
    }
    return user.username.charAt(0).toUpperCase();
  };

  // Safe username display
  const getDisplayUsername = (user: User) => {
    return user.username || user.email || "Unknown User";
  };

  // Fetch users (useCallback to satisfy ESLint react-hooks/exhaustive-deps)
  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          ...(searchTerm && { search: searchTerm }),
          ...(serviceTypeFilter && { serviceType: serviceTypeFilter })
        });

        const response = await fetch(`${API_BASE}/api/admin/users?${params}`);

        if (!response.ok) {
          const errorData =
            (await response.json().catch(() => ({} as { error?: string }))) || {};
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }

        const data: { users: Partial<User>[]; pagination: PaginationInfo } =
          await response.json();

        // Ensure all users have required fields and set defaults
        const safeUsers: User[] = (data.users || []).map((u) => {
          const uu = u as Partial<User>;
          return {
            _id: uu._id || "",
            username: uu.username || "",
            email: uu.email || "",
            phone: uu.phone || "",
            website: uu.website || "",
            bio: uu.bio || "",
            status: uu.status || "",
            serviceType: (uu.serviceType as User["serviceType"]) || "serviceSeeker",
            createdAt: uu.createdAt || new Date().toISOString(),
            profilePic: uu.profilePic || "",
            coverImage: uu.coverImage || "",
            googleId: uu.googleId
          };
        });

        setUsers(safeUsers);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Fetch users error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, searchTerm, serviceTypeFilter]
  );

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/stats`);
      if (response.ok) {
        const data: UserStats = await response.json();
        setStats(data);
      } else {
        console.error("Stats fetch failed with status:", response.status);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [API_BASE]);

  // initial load
  useEffect(() => {
    fetchUsers(1);
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Ensure edit form shows current selected user data
  useEffect(() => {
    if (selectedUser) {
      setEditForm({
        username: selectedUser.username || "",
        email: selectedUser.email || "",
        phone: selectedUser.phone || "",
        website: selectedUser.website || "",
        bio: selectedUser.bio || "",
        status: selectedUser.status || ""
      });
    }
  }, [selectedUser]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchUsers(newPage);
  };

  // Handle edit user
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      website: user.website || "",
      bio: user.bio || "",
      status: user.status || ""
    });
    setShowEditModal(true);
  };

  // Handle update user
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setError("");
      const response = await fetch(`${API_BASE}/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData =
          (await response.json().catch(() => ({} as { error?: string }))) || {};
        throw new Error(errorData?.error || "Failed to update user");
      }

      const data = await response.json();
      setUsers((prev) => prev.map((user) => (user._id === selectedUser._id ? data.user : user)));
      setShowEditModal(false);
      setSelectedUser(null);
      setUpdateSuccessMessage("User updated successfully");
      setShowUpdateSuccessModal(true);
      setSuccess("User updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update user error:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  // Handle delete user
  const handleDelete = async (userId: string) => {
    try {
      setError("");
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData =
          (await response.json().catch(() => ({} as { error?: string }))) || {};
        throw new Error(errorData?.error || "Failed to delete user");
      }

      const deletedUser = users.find((u) => u._id === userId);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
      setDeleteConfirm(null);

      setDeleteSuccessMessage(
        `${deletedUser ? getDisplayUsername(deletedUser) : "User"} deleted successfully`
      );
      setShowDeleteSuccessModal(true);

      setSuccess("User deleted successfully");
      setTimeout(() => setSuccess(""), 3000);

      fetchStats();
      fetchUsers(pagination.currentPage);
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setServiceTypeFilter("");
    fetchUsers(1);
  };

  // Refresh data
  const refreshData = () => {
    fetchUsers(pagination.currentPage);
    fetchStats();
    setSuccess("Data refreshed successfully");
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all users in the system</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setCurrentView("admindashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Service Seekers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.serviceSeekerCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Service Providers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.postingCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisWeek}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-700"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Modern dropdown UI */}
            <div className="relative w-64">
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-10 text-gray-700 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                aria-label="Filter by user type"
              >
                <option value="">All Types</option>
                <option value="serviceSeeker">Service Seekers</option>
                <option value="posting">Service Providers</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-gray-600">No users found</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {getUsernameInitial(user)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {getDisplayUsername(user)}
                              </div>
                              {user.googleId && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Google
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.serviceType === "posting"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.serviceType === "posting" ? "Service Provider" : "Service Seeker"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={user.status}>
                            {user.status || "No status"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user._id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.currentPage - 1) * 10 + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(pagination.currentPage * 10, pagination.totalUsers)}</span>{" "}
                      of <span className="font-medium">{pagination.totalUsers}</span> users
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className={`px-3 py-1 rounded border ${
                          pagination.hasPrev
                            ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        }`}
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className={`px-3 py-1 rounded border ${
                          pagination.hasNext
                            ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        // Overlay: transparent + subtle backdrop blur. Clicking outside closes modal.
        <div
          ref={editOverlayRef}
          className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === editOverlayRef.current) {
              setShowEditModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Edit User</h3>
                  <p className="text-sm text-gray-500">ID: <span className="font-mono">{selectedUser._id}</span></p>
                  <p className="text-sm text-gray-500">Type: <span className="font-medium">{selectedUser.serviceType === "posting" ? "Service Provider" : "Service Seeker"}</span></p>
                  {selectedUser.googleId && <p className="text-sm text-blue-600">Signed in with Google</p>}
                </div>
                <div>
                  <button
                    onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close edit modal"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-700"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-700"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <div className="flex gap-2">
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-700"
                      maxLength={32}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update User
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          ref={deleteOverlayRef}
          className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === deleteOverlayRef.current) {
              setDeleteConfirm(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccessModal && (
        <div
          ref={deleteSuccessOverlayRef}
          className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === deleteSuccessOverlayRef.current) {
              setShowDeleteSuccessModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Deleted</h3>
            <p className="text-gray-600 mb-4">{deleteSuccessMessage}</p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowDeleteSuccessModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Success Modal */}
      {showUpdateSuccessModal && (
        <div
          ref={updateSuccessOverlayRef}
          className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === updateSuccessOverlayRef.current) {
              setShowUpdateSuccessModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Update Successful</h3>
            <p className="text-gray-600 mb-4">{updateSuccessMessage}</p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowUpdateSuccessModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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