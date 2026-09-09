import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL, DEFAULT_USER_AVATAR } from "../utils/constants";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { removeUser } from "../utils/userSlice";

const SKILLS_COLORS = [
  "badge-primary",
  "badge-secondary",
  "badge-accent",
  "badge-info",
  "badge-success",
  "badge-warning",
];

const Requests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const requests = useSelector((store) => store.requests);

  const [loading, setLoading] = useState(!requests);
  const [error, setError] = useState(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // { [requestId]: "accepted" | "rejected" }
  const [toast, setToast] = useState(null); // { message: string, type: "success" | "error" }
  const [searchQuery, setSearchQuery] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const processError = (err) => {
    console.error("Failed to fetch requests:", err);
    console.error("Backend error response:", err?.response?.data);

    const errorData = err?.response?.data;
    const errorMsg =
      (typeof errorData === "string" ? errorData : errorData?.message) ||
      err?.message ||
      "Failed to load requests.";

    const isAuth =
      err?.response?.status === 401 ||
      (typeof errorMsg === "string" &&
        (errorMsg.toLowerCase().includes("token") ||
          errorMsg.toLowerCase().includes("login") ||
          errorMsg.toLowerCase().includes("jwt") ||
          errorMsg.toLowerCase().includes("not authorized")));

    if (isAuth) {
      setAuthExpired(true);
      setError("Your session has expired or token is invalid. Please log in again.");
    } else {
      setAuthExpired(false);
      setError(errorMsg);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setAuthExpired(false);
    try {
      const res = await axios.get(`${BASE_URL}/user/requests/received`, {
        withCredentials: true,
      });
      const data = res?.data?.data || res?.data || [];
      dispatch(addRequests(Array.isArray(data) ? data : []));
    } catch (err) {
      processError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchRequests = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/user/requests/received`, {
          withCredentials: true,
        });
        if (!ignore) {
          const data = res?.data?.data || res?.data || [];
          dispatch(addRequests(Array.isArray(data) ? data : []));
        }
      } catch (err) {
        if (!ignore) {
          processError(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchRequests();
    return () => {
      ignore = true;
    };
  }, [dispatch]);

  const handleReview = async (status, requestId, senderName) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: status }));
    try {
      await axios.post(
        `${BASE_URL}/request/review/${status}/${requestId}`,
        {},
        { withCredentials: true }
      );
      dispatch(removeRequest(requestId));
      if (status === "accepted") {
        showToast(`Accepted connection request from ${senderName}! 🎉`, "success");
      } else {
        showToast(`Rejected request from ${senderName}.`, "info");
      }
    } catch (err) {
      console.error(`Failed to review request (${status}):`, err);
      const errMsg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err?.response?.data : null) ||
        `Failed to ${status} request`;
      showToast(errMsg, "error");
    } finally {
      setActionLoading((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    }
  };

  const handleRelogin = () => {
    dispatch(removeUser());
    navigate("/login");
  };

  // Filter requests based on search query
  const filteredRequests = (requests || []).filter((req) => {
    const sender = req?.fromUserId;
    if (!sender) return false;
    const fullName = `${sender.firstName || ""} ${sender.lastName || ""}`.toLowerCase();
    const about = (sender.about || "").toLowerCase();
    const skills = Array.isArray(sender.skills)
      ? sender.skills.join(" ").toLowerCase()
      : (sender.skills || "").toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    return (
      fullName.includes(query) ||
      about.includes(query) ||
      skills.includes(query)
    );
  });

  return (
    <div className="flex-1 bg-base-200/40 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Connection Requests
              </h1>
              {requests && (
                <span className="badge badge-secondary badge-lg font-semibold">
                  {requests.length}
                </span>
              )}
            </div>
            <p className="text-sm text-base-content/60 mt-1">
              Developers who want to connect with you
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm sm:input-md w-full pl-9 pr-8"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="btn btn-ghost btn-xs btn-circle absolute right-2 top-1/2 -translate-y-1/2"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="btn btn-outline btn-sm sm:btn-md gap-2"
              title="Refresh requests"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert alert-error shadow-md rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <div className="font-semibold text-sm sm:text-base">{error}</div>
                {authExpired && (
                  <div className="text-xs opacity-90 mt-0.5">
                    Your login cookie has expired. Please log in again to authenticate your session.
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-auto">
              {authExpired ? (
                <button
                  onClick={handleRelogin}
                  className="btn btn-sm btn-neutral shadow"
                >
                  Log In Again
                </button>
              ) : (
                <button
                  onClick={handleRefresh}
                  className="btn btn-sm btn-ghost border border-base-100"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && !requests && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="skeleton w-16 h-16 rounded-full shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-1/3"></div>
                    <div className="skeleton h-3 w-1/4"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="skeleton h-9 w-20 rounded-lg"></div>
                    <div className="skeleton h-9 w-20 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State: No Requests */}
        {!loading && requests && requests.length === 0 && (
          <div className="card bg-base-100 border border-base-300 shadow-sm text-center py-16 px-6">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl">📬</div>
              <h2 className="text-2xl font-bold">No Pending Requests</h2>
              <p className="text-sm text-base-content/60">
                You have no incoming connection requests right now. Explore the feed
                to discover new developers and connect!
              </p>
              <div className="pt-2">
                <Link to="/" className="btn btn-primary shadow-md">
                  Explore Developers
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty State: Search yielded no matches */}
        {!loading &&
          requests &&
          requests.length > 0 &&
          filteredRequests.length === 0 && (
            <div className="card bg-base-100 border border-base-300 shadow-sm text-center py-12 px-6">
              <div className="max-w-md mx-auto space-y-3">
                <div className="text-4xl">🔍</div>
                <h3 className="text-lg font-semibold">No matches found</h3>
                <p className="text-sm text-base-content/60">
                  No requests matching &quot;{searchQuery}&quot;.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="btn btn-sm btn-ghost text-primary"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}

        {/* Requests List */}
        {filteredRequests && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const sender = req?.fromUserId;
              if (!sender) return null;
              const requestId = req._id;
              const isActionRunning = Boolean(actionLoading[requestId]);
              const currentAction = actionLoading[requestId];
              const senderName = `${sender.firstName || "Developer"} ${
                sender.lastName || ""
              }`.trim();
              const skills = Array.isArray(sender.skills)
                ? sender.skills
                : typeof sender.skills === "string" && sender.skills
                ? sender.skills.split(",").map((s) => s.trim())
                : [];

              return (
                <div
                  key={requestId}
                  className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200 p-5 rounded-2xl"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    {/* Left: Avatar + Details */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="avatar shrink-0">
                        <div className="w-16 h-16 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100 overflow-hidden">
                          <img
                            src={
                              sender.photoURL ||
                              sender.photoUrl ||
                              DEFAULT_USER_AVATAR
                            }
                            alt={senderName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_USER_AVATAR;
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold truncate">
                            {senderName}
                          </h2>
                          {sender.age && (
                            <span className="text-xs text-base-content/70">
                              {sender.age} yrs
                            </span>
                          )}
                          {sender.gender && (
                            <span className="badge badge-sm badge-ghost capitalize text-xs">
                              {sender.gender}
                            </span>
                          )}
                        </div>

                        {sender.about && (
                          <p className="text-sm text-base-content/80 line-clamp-2 leading-relaxed">
                            {sender.about}
                          </p>
                        )}

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {skills.slice(0, 5).map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className={`badge badge-outline badge-xs ${
                                  SKILLS_COLORS[sIdx % SKILLS_COLORS.length]
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                            {skills.length > 5 && (
                              <span className="badge badge-ghost badge-xs text-base-content/60">
                                +{skills.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Accept & Reject Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-base-200">
                      {/* Reject Button */}
                      <button
                        onClick={() =>
                          handleReview("rejected", requestId, senderName)
                        }
                        disabled={isActionRunning}
                        className="btn btn-sm btn-outline btn-error hover:text-white gap-1.5 flex-1 sm:flex-none"
                      >
                        {currentAction === "rejected" ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                        <span>Reject</span>
                      </button>

                      {/* Accept Button */}
                      <button
                        onClick={() =>
                          handleReview("accepted", requestId, senderName)
                        }
                        disabled={isActionRunning}
                        className="btn btn-sm btn-success text-white shadow gap-1.5 flex-1 sm:flex-none"
                      >
                        {currentAction === "accepted" ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        <span>Accept</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast toast-top toast-center z-50">
          <div
            className={`alert text-sm py-2 px-5 shadow-xl text-white font-medium rounded-xl ${
              toast.type === "success"
                ? "alert-success"
                : toast.type === "error"
                ? "alert-error"
                : "alert-info"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
