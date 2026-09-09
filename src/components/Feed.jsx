import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL, DEFAULT_USER_AVATAR } from "../utils/constants";
import { addFeed, removeUserFromFeed } from "../utils/feedSlice";
import { sendConnectionRequest } from "../utils/requestApi";

const SKILLS_COLORS = [
  "badge-primary",
  "badge-secondary",
  "badge-accent",
  "badge-info",
  "badge-success",
  "badge-warning",
];

const UserCard = ({ user, onLike, onSkip, actionLoading }) => {
  const skills = Array.isArray(user?.skills) ? user.skills : [];

  return (
    <div className="card bg-base-100 shadow-2xl w-80 sm:w-96 border border-base-300 overflow-hidden select-none">
      {/* Photo */}
      <figure className="relative h-72 bg-base-200 overflow-hidden">
        <img
          src={
            user?.photoURL ||
            user?.photoUrl ||
            DEFAULT_USER_AVATAR
          }
          alt={`${user?.firstName} ${user?.lastName}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_USER_AVATAR;
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Name & age on photo */}
        <div className="absolute bottom-3 left-4 text-white">
          <h2 className="text-xl font-bold leading-tight drop-shadow">
            {user?.firstName} {user?.lastName}
            {user?.age && (
              <span className="text-base font-normal opacity-90">, {user.age}</span>
            )}
          </h2>
          {user?.gender && (
            <span className="text-xs opacity-80 capitalize">{user.gender}</span>
          )}
        </div>
      </figure>

      {/* Card body */}
      <div className="card-body p-4 gap-2">
        {user?.about && (
          <p className="text-sm text-base-content/75 line-clamp-2">{user.about}</p>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className={`badge badge-outline badge-sm ${
                  SKILLS_COLORS[idx % SKILLS_COLORS.length]
                }`}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mt-3">
          <button
            onClick={onSkip}
            disabled={actionLoading}
            className="btn btn-circle btn-outline border-2 border-error text-error hover:bg-error hover:text-white hover:border-error w-14 h-14 shadow-md transition-all duration-200"
          >
            {actionLoading === "skip" ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>

          <button
            onClick={onLike}
            disabled={actionLoading}
            className="btn btn-circle btn-outline border-2 border-success text-success hover:bg-success hover:text-white hover:border-success w-14 h-14 shadow-md transition-all duration-200"
          >
            {actionLoading === "like" ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Feed = () => {
  const dispatch = useDispatch();
  const feed = useSelector((store) => store.feed);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // "like" | "skip" | null
  const [toast, setToast] = useState(null); // { type: "like" | "skip", name: string }

  const fetchFeed = async () => {
    if (feed && feed.length > 0) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/user/feed`, {
        withCredentials: true,
      });
      const data = res?.data?.data || res?.data?.users || res?.data;
      dispatch(addFeed(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Failed to fetch feed:", err);
      dispatch(addFeed([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const showToast = (type, name, message) => {
    setToast({ type, name, message });
    setTimeout(() => setToast(null), 2500);
  };

  const handleLike = async (userId, firstName) => {
    setActionLoading("like");
    try {
      await sendConnectionRequest("interested", userId);
      dispatch(removeUserFromFeed(userId));
      showToast("like", firstName);
    } catch (err) {
      console.error("Like request failed:", err);
      const errMsg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err?.response?.data : null) ||
        "Failed to send request";
      showToast("error", firstName, errMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (userId, firstName) => {
    setActionLoading("skip");
    try {
      await sendConnectionRequest("ignored", userId);
      dispatch(removeUserFromFeed(userId));
      showToast("skip", firstName);
    } catch (err) {
      console.error("Skip request failed:", err);
      const errMsg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err?.response?.data : null) ||
        "Failed to ignore user";
      showToast("error", firstName, errMsg);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-200/40">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/60">Finding developers for you...</p>
        </div>
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-200/40">
        <div className="text-center flex flex-col items-center gap-3 p-8">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold">You're all caught up!</h2>
          <p className="text-base-content/60 text-sm max-w-xs">
            No more developers to discover right now. Check back later for new connections.
          </p>
        </div>
      </div>
    );
  }

  const currentUser = feed[0];

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-base-200/40 py-8 px-4 relative">
      {/* Counter */}
      <p className="text-xs text-base-content/50 mb-4 font-medium uppercase tracking-wider">
        {feed.length} developer{feed.length !== 1 ? "s" : ""} left
      </p>

      <UserCard
        user={currentUser}
        onLike={() => handleLike(currentUser._id, currentUser.firstName)}
        onSkip={() => handleSkip(currentUser._id, currentUser.firstName)}
        actionLoading={actionLoading}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast toast-top toast-center z-50">
          <div
            className={`alert text-sm py-2 px-5 shadow-xl text-white font-medium rounded-xl ${
              toast.type === "like"
                ? "alert-success"
                : toast.type === "skip"
                ? "alert-info"
                : "alert-error"
            }`}
          >
            {toast.type === "like" && `💚 Liked ${toast.name}!`}
            {toast.type === "skip" && `👋 Skipped ${toast.name}`}
            {toast.type === "error" && `⚠️ ${toast.message || "Action failed"}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;

