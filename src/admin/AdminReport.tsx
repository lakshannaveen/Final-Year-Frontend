"use client";
import React, { useEffect, useState } from "react";
import { Trash, Eye, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type Report = {
  _id: string;
  postId: string;
  reporter?: { _id: string; username?: string; email?: string } | null;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
};

type Props = {
  setCurrentView: (view: string) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminReport({ setCurrentView }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${API_URL}/api/report/admin?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data.reports || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err?.message || "Error fetching reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchReports();
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reportId: string, status: string) => {
    setActionLoading(reportId + ":status");
    try {
      const res = await fetch(`${API_URL}/api/report/admin/${reportId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      setReports(prev => prev.map(r => (r._id === data.report._id ? data.report : r)));
    } catch (err: any) {
      setError(err?.message || "Error updating status");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setActionLoading(reportId + ":delete");
    try {
      const res = await fetch(`${API_URL}/api/report/admin/${reportId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete report");
      setReports(prev => prev.filter(r => r._id !== reportId));
    } catch (err: any) {
      setError(err?.message || "Error deleting report");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView("admindashboard")}
              aria-label="Back to dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold text-blue-900">Admin - Reports</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              {/* temporary 'Back to Dashboard' text removed */}
            </div>
            <select
              value={statusFilter}
              onChange={e => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-800"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
            </select>
            {/* Back to Dashboard text button removed (left-arrow icon kept) */}
          </div>
        </header>

        <div className="bg-white rounded shadow p-4">
          {error && <div className="text-red-600 mb-3">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-sm text-gray-700 font-medium uppercase tracking-wide">Post</th>
                  <th className="p-2 text-sm text-gray-700 font-medium uppercase tracking-wide">Reporter</th>
                  <th className="p-2 text-sm text-gray-700 font-medium uppercase tracking-wide">Reason</th>
                  <th className="p-2 text-sm text-gray-700 font-medium uppercase tracking-wide">Status</th>
                  <th className="p-2 text-sm text-gray-700 font-medium uppercase tracking-wide">Submitted</th>
                  <th className="p-2 text-sm text-gray-700 font-medium uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-600">
                      Loading...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-600">
                      No reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map(r => (
                    <tr key={r._id} className="border-b hover:bg-gray-50">
                      <td className="p-2 align-top text-gray-800 break-words">{r.postId}</td>
                      <td className="p-2 align-top text-gray-800">{r.reporter?.username || r.reporter?.email || "Anonymous"}</td>
                      <td className="p-2 align-top text-gray-800">{r.reason}</td>
                      <td className="p-2 align-top">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : r.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>{r.status}</span>

                          <select
                            value={r.status}
                            onChange={e => updateStatus(r._id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-800"
                            disabled={Boolean(actionLoading)}
                            aria-label={`Change status for report ${r._id}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-2 align-top text-gray-800">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="p-2 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelected(r)}
                            title="View"
                            className="flex items-center gap-2 px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                          >
                            <Eye size={16} />
                            <span className="text-sm">View</span>
                          </button>
                          <button
                            onClick={() => deleteReport(r._id)}
                            title="Delete"
                            className="flex items-center gap-2 px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            <Trash size={16} />
                            <span className="text-sm">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700 font-medium">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 text-gray-900">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
                <button onClick={() => setSelected(null)} className="text-gray-800 font-medium">Close</button>
              </div>
              <div className="mt-4">
                <div className="p-6 bg-gray-50 rounded-lg text-gray-800">
                  <div className="mb-3">
                    <strong className="block text-sm text-gray-700">Post ID</strong>
                    <div className="text-sm">{selected.postId}</div>
                  </div>

                  <div className="mb-3">
                    <strong className="block text-sm text-gray-700">Reporter</strong>
                    <div className="text-sm">{selected.reporter?.username || selected.reporter?.email || 'Anonymous'}</div>
                  </div>

                  <div className="mb-3">
                    <strong className="block text-sm text-gray-700">Reason</strong>
                    <div className="mt-2 p-3 bg-white border rounded text-sm">{selected.reason}</div>
                  </div>

                  <div className="mb-3 flex items-center gap-3">
                    <strong className="text-sm text-gray-700">Status</strong>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      selected.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : selected.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>{selected.status}</span>
                  </div>

                  <div>
                    <strong className="block text-sm text-gray-700">Submitted</strong>
                    <div className="text-sm">{new Date(selected.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                {/* bottom actions removed per design: only header close remains */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}