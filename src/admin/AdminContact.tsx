"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, RefreshCw, Trash2, Eye, EyeOff, CheckCircle, Clock, Mail, Phone, User } from "lucide-react";

interface Contact {
  _id: string;
  name: string;
  email: string;
  message: string;
  phone?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

interface ContactStats {
  total: number;
  today: number;
  thisWeek: number;
  pending: number;
  reviewed: number;
  resolved: number;
}

interface Props {
  setCurrentView: (view: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminContact({ setCurrentView }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filters, setFilters] = useState({
    status: '' as '' | 'pending' | 'reviewed' | 'resolved',
    search: '',
    page: 1
  });

  // New state: shows the green "Back to Dashboard" text to the right under the Refresh button after a successful refresh
  const [showBackText, setShowBackText] = useState(false);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', '10');

      const response = await fetch(`${API_URL}/api/contact/admin/contacts?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const data = await response.json();
      setContacts(data.contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      alert('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contact/admin/stats`);

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [filters.status, filters.page]);

  const updateStatus = async (contactId: string, status: 'pending' | 'reviewed' | 'resolved') => {
    try {
      setUpdating(contactId);
      const response = await fetch(`${API_URL}/api/contact/admin/${contactId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setContacts(prev => 
        prev.map(contact => 
          contact._id === contactId ? { ...contact, status } : contact
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

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact inquiry?')) {
      return;
    }

    try {
      setDeleting(contactId);
      const response = await fetch(`${API_URL}/api/contact/admin/${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      // Remove from local state
      setContacts(prev => prev.filter(contact => contact._id !== contactId));
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
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

  // New handler to refresh contacts and stats, and show the green "Back to Dashboard" text on success
  const handleRefresh = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchContacts(), fetchStats()]);
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

  const viewContactDetails = async (contactId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/contact/admin/${contactId}`);
      if (!response.ok) throw new Error('Failed to fetch contact details');
      
      const data = await response.json();
      setSelectedContact(data.contact);
    } catch (error) {
      console.error('Error fetching contact details:', error);
      alert('Failed to load contact details');
    }
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
           
            </button>
            <h1 className="text-2xl font-semibold text-blue-900">Admin - Contact Inquiries</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.today}</div>
              <div className="text-sm text-gray-600">Today</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
              <div className="text-sm text-gray-600">This Week</div>
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
                  placeholder="Search contacts by name, email, or message..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <RefreshCw size={32} className="animate-spin text-blue-600" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No contact inquiries found.
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => (
                <div key={contact._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Contact Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {contact.name}
                          </h3>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail size={14} />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone size={14} />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2 line-clamp-2">{contact.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatDate(contact.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Status Badge and Controls */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(contact.status)}`}>
                          {getStatusIcon(contact.status)}
                          {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                        </span>
                        
                        {/* Status Buttons */}
                        <div className="flex gap-1">
                          {contact.status !== 'pending' && (
                            <button
                              onClick={() => updateStatus(contact._id, 'pending')}
                              disabled={updating === contact._id}
                              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition disabled:opacity-50"
                            >
                              {updating === contact._id ? '...' : 'Pending'}
                            </button>
                          )}
                          {contact.status !== 'reviewed' && (
                            <button
                              onClick={() => updateStatus(contact._id, 'reviewed')}
                              disabled={updating === contact._id}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition disabled:opacity-50"
                            >
                              {updating === contact._id ? '...' : 'Review'}
                            </button>
                          )}
                          {contact.status !== 'resolved' && (
                            <button
                              onClick={() => updateStatus(contact._id, 'resolved')}
                              disabled={updating === contact._id}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition disabled:opacity-50"
                            >
                              {updating === contact._id ? '...' : 'Resolve'}
                            </button>
                          )}
                        </div>

                        {/* View Details Button */}
                        <button
                          onClick={() => viewContactDetails(contact._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteContact(contact._id)}
                          disabled={deleting === contact._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                          title="Delete contact"
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
        {contacts.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700"
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

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Contact Details</h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{selectedContact.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedContact.email}</p>
                </div>

                {selectedContact.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900">{selectedContact.phone}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <p className="text-gray-900">{formatDate(selectedContact.createdAt)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${getStatusColor(selectedContact.status)}`}>
                    {getStatusIcon(selectedContact.status)}
                    {selectedContact.status.charAt(0).toUpperCase() + selectedContact.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}