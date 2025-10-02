"use client";
import { useEffect, useState } from "react";
import { Star, Edit3, Trash2 } from "lucide-react";

interface Review {
  _id: string;
  reviewerId: {
    _id: string;
    username: string;
    profilePic?: string;
  };
  rating: number;
  message: string;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface ReviewProps {
  userId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SHOW_LIMIT = 5;

// --- Skeleton Components ---
function ReviewSectionSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden p-8 mb-10 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="w-24 h-8 bg-gray-200 rounded" />
        <div className="w-48 h-8 bg-gray-200 rounded" />
      </div>
      <div className="w-full h-16 bg-gray-200 rounded-lg mb-6" />
      {[...Array(3)].map((_, i) => (
        <ReviewSkeleton key={i} />
      ))}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-pulse mb-4">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 mr-4" />
        <div className="flex-1">
          <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-16 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-20 h-4 bg-gray-200 rounded" />
        <div className="w-full h-3 bg-gray-200 rounded" />
        <div className="w-3/4 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// --- Helpers ---
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

// Star Rating Component
function StarRating({
  rating,
  onRatingChange,
  editable = false,
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  editable?: boolean;
}) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => editable && onRatingChange?.(star)}
          className={`${
            editable ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"
          } ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          disabled={!editable}
        >
          <Star size={20} fill={star <= rating ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

// Review Form Component
function ReviewForm({
  onSubmit,
  onCancel,
  initialRating = 0,
  initialMessage = "",
  isEditing = false,
}: {
  onSubmit: (rating: number, message: string) => void;
  onCancel: () => void;
  initialRating?: number;
  initialMessage?: string;
  isEditing?: boolean;
}) {
  const [rating, setRating] = useState(initialRating);
  const [message, setMessage] = useState(initialMessage);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !message.trim()) return;

    setSubmitting(true);
    await onSubmit(rating, message.trim());
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">{isEditing ? "Edit Your Review" : "Write a Review"}</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Rating</label>
          <StarRating rating={rating} onRatingChange={setRating} editable />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Review Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your experience with this user..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={4}
            maxLength={500}
            required
            style={{ color: "#000" }} // always black text
          />
          <div className="text-right text-sm text-gray-500 mt-1">{message.length}/500</div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={rating === 0 || !message.trim() || submitting}
            className="px-6 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : isEditing ? "Update Review" : "Submit Review"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ReviewSection({ userId }: ReviewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // Modal for all reviews
  const [showAllModal, setShowAllModal] = useState(false);

  // --- Fetch Reviews ---
  useEffect(() => {
    setReviewsLoading(true);
    fetch(`${API_URL}/api/reviews/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) {
          setReviews(data.reviews);
          setReviewStats({
            averageRating: data.averageRating,
            totalReviews: data.totalReviews,
          });
        } else {
          setReviews([]);
          setReviewStats({ averageRating: 0, totalReviews: 0 });
        }
        setReviewsLoading(false);
      })
      .catch(() => {
        setReviews([]);
        setReviewStats({ averageRating: 0, totalReviews: 0 });
        setReviewsLoading(false);
      });

    // Check if current user has reviewed
    fetch(`${API_URL}/api/reviews/check/${userId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUserHasReviewed(data.hasReviewed);
        if (data.review) {
          setEditingReview(data.review);
        } else {
          setEditingReview(null);
        }
      })
      .catch(() => setEditingReview(null));
  }, [userId]);

  const handleSubmitReview = async (rating: number, message: string) => {
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          reviewedUserId: userId,
          rating,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReviews((prev) => [data.review, ...prev]);
        setReviewStats((prev) => ({
          averageRating: (prev.averageRating * prev.totalReviews + rating) / (prev.totalReviews + 1),
          totalReviews: prev.totalReviews + 1,
        }));
        setShowReviewForm(false);
        setUserHasReviewed(true);
        setEditingReview(data.review);
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch (error) {
      alert("Error submitting review");
    }
  };

  const handleUpdateReview = async (rating: number, message: string) => {
    if (!editingReview) return;

    try {
      const response = await fetch(`${API_URL}/api/reviews/${editingReview._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ rating, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setReviews((prev) => prev.map((review) => (review._id === editingReview._id ? data.review : review)));

        // Recalculate average rating
        const newTotal = reviews.reduce((sum, review) => {
          if (review._id === editingReview._id) return sum + rating;
          return sum + review.rating;
        }, 0);

        setReviewStats((prev) => ({
          averageRating: newTotal / prev.totalReviews,
          totalReviews: prev.totalReviews,
        }));

        setShowReviewForm(false);
        setEditingReview(data.review);
      } else {
        alert(data.error || "Failed to update review");
      }
    } catch (error) {
      alert("Error updating review");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        const deletedReview = reviews.find((r) => r._id === reviewId);
        if (deletedReview) {
          setReviews((prev) => prev.filter((review) => review._id !== reviewId));
          setReviewStats((prev) => {
            const newTotal = prev.totalReviews - 1;
            const newAverage =
              newTotal > 0 ? (prev.averageRating * prev.totalReviews - deletedReview.rating) / newTotal : 0;
            return {
              averageRating: newAverage,
              totalReviews: newTotal,
            };
          });
          setUserHasReviewed(false);
          setEditingReview(null);
        }
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete review");
      }
    } catch (error) {
      alert("Error deleting review");
    }
  };

  const getInitial = (name = "") => name.charAt(0).toUpperCase();

  // Modal content for all reviews
  const AllReviewsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowAllModal(false)}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl border border-green-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-green-700">All Reviews</h3>
          <button
            className="text-gray-500 text-2xl font-bold px-3 py-1 rounded hover:bg-gray-100"
            onClick={() => setShowAllModal(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {reviews.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No reviews available.</div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl shadow border border-gray-200 p-6 mb-4">
              <div className="flex items-center mb-4">
                {review.reviewerId.profilePic ? (
                  <img
                    src={review.reviewerId.profilePic}
                    alt={review.reviewerId.username}
                    className="w-12 h-12 rounded-full object-cover border border-gray-300 mr-4"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg border border-gray-300 mr-4">
                    {getInitial(review.reviewerId.username)}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{review.reviewerId.username}</h4>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm text-gray-500">{timeAgo(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              <p className="text-black leading-relaxed">{review.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Show skeleton while loading
  if (reviewsLoading) {
    return <ReviewSectionSkeleton />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden p-8 mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-green-700">Reviews</h3>
        {reviewStats.totalReviews > 0 && (
          <div className="text-right">
            <div className="flex items-center gap-2">
              <StarRating rating={reviewStats.averageRating} />
              <span className="text-lg font-bold text-gray-800">{reviewStats.averageRating.toFixed(1)}</span>
              <span className="text-gray-500">
                ({reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? "s" : ""})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Review Form or Add Review Button */}
      {!userHasReviewed ? (
        !showReviewForm ? (
          <button
            onClick={() => setShowReviewForm(true)}
            className="w-full mb-6 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <Edit3 size={20} />
            Write a Review
          </button>
        ) : (
          <ReviewForm onSubmit={handleSubmitReview} onCancel={() => setShowReviewForm(false)} />
        )
      ) : editingReview && !showReviewForm ? (
        <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-green-800">Your Review</h4>
              <StarRating rating={editingReview.rating} />
              <p className="text-black mt-2">{editingReview.message}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReviewForm(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Edit review"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => handleDeleteReview(editingReview._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete review"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        editingReview &&
        showReviewForm && (
          <ReviewForm
            onSubmit={handleUpdateReview}
            onCancel={() => setShowReviewForm(false)}
            initialRating={editingReview.rating}
            initialMessage={editingReview.message}
            isEditing={true}
          />
        )
      )}

      {/* Reviews List (first SHOW_LIMIT) */}
      {reviews.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No reviews yet. Be the first to review!</div>
      ) : (
        <>
          {reviews.slice(0, SHOW_LIMIT).map((review) => (
            <div key={review._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-4">
              <div className="flex items-center mb-4">
                {review.reviewerId.profilePic ? (
                  <img
                    src={review.reviewerId.profilePic}
                    alt={review.reviewerId.username}
                    className="w-12 h-12 rounded-full object-cover border border-gray-300 mr-4"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg border border-gray-300 mr-4">
                    {getInitial(review.reviewerId.username)}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{review.reviewerId.username}</h4>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm text-gray-500">{timeAgo(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              <p className="text-black leading-relaxed">{review.message}</p>
            </div>
          ))}
          {reviews.length > SHOW_LIMIT && (
            <button
              className="w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg font-semibold hover:bg-green-200 transition mb-2"
              onClick={() => setShowAllModal(true)}
            >
              View All Reviews
            </button>
          )}
        </>
      )}

      {/* All Reviews Modal */}
      {showAllModal && <AllReviewsModal />}
    </div>
  );
}