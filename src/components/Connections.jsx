import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL, DEFAULT_USER_AVATAR } from "../utils/constants";
import { addConnections } from "../utils/connectionSlice";
import { removeUser } from "../utils/userSlice";

const SKILLS_COLORS = [
  "badge-primary",
  "badge-secondary",
  "badge-accent",
  "badge-info",
  "badge-success",
  "badge-warning",
];

const Connections = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const connections = useSelector((store) => store.connections);
  const loggedInUser = useSelector((store) => store.user);

  const [loading, setLoading] = useState(!connections);
  const [error, setError] = useState(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const processError = (err) => {
    console.error("Failed to fetch connections:", err);
    console.error("Backend error response:", err?.response?.data);

    const errorData = err?.response?.data;
    const errorMsg =
      (typeof errorData === "string" ? errorData : errorData?.message) ||
      err?.message ||
      "Failed to load connections.";

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
      const res = await axios.get(`${BASE_URL}/user/connections`, {
        withCredentials: true,
      });
      const data = res?.data?.data || res?.data || [];
      dispatch(addConnections(Array.isArray(data) ? data : []));
    } catch (err) {
      processError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchConnections = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/user/connections`, {
          withCredentials: true,
        });
        if (!ignore) {
          const data = res?.data?.data || res?.data || [];
          dispatch(addConnections(Array.isArray(data) ? data : []));
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

    fetchConnections();
    return () => {
      ignore = true;
    };
  }, [dispatch]);

  const handleRelogin = () => {
    dispatch(removeUser());
    navigate("/login");
  };

  // Helper to normalize connection object (whether backend returns populated user directly or request object)
  const getConnectedUser = (connection) => {
    if (!connection) return null;
    if (connection.firstName) return connection;
    if (connection.fromUserId && connection.toUserId) {
      return connection.fromUserId._id === loggedInUser?._id
        ? connection.toUserId
        : connection.fromUserId;
    }
    return connection.fromUserId || connection.toUserId || connection;
  };

  // Filter connections based on search query
  const filteredConnections = (connections || []).filter((item) => {
    const user = getConnectedUser(item);
    if (!user) return false;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const about = (user.about || "").toLowerCase();
    const skills = Array.isArray(user.skills)
      ? user.skills.join(" ").toLowerCase()
      : (user.skills || "").toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    return (
      fullName.includes(query) ||
      about.includes(query) ||
      skills.includes(query)
    );
  });

  return (
    <div className="flex-1 bg-base-200/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                My Connections
              </h1>
              {connections && (
                <span className="badge badge-primary badge-lg font-semibold">
                  {connections.length}
                </span>
              )}
            </div>
            <p className="text-sm text-base-content/60 mt-1">
              Developers you are connected and collaborating with
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search by name, skill..."
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
              title="Refresh connections"
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
        {loading && !connections && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="skeleton w-16 h-16 rounded-full shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-3/4"></div>
                    <div className="skeleton h-3 w-1/2"></div>
                  </div>
                </div>
                <div className="skeleton h-3 w-full"></div>
                <div className="skeleton h-3 w-5/6"></div>
                <div className="flex gap-2 pt-2">
                  <div className="skeleton h-5 w-16 rounded-full"></div>
                  <div className="skeleton h-5 w-14 rounded-full"></div>
                  <div className="skeleton h-5 w-20 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State: No Connections */}
        {!loading && connections && connections.length === 0 && (
          <div className="card bg-base-100 border border-base-300 shadow-sm text-center py-16 px-6">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl">🤝</div>
              <h2 className="text-2xl font-bold">No Connections Yet</h2>
              <p className="text-sm text-base-content/60">
                You haven't made any connections yet. Head over to the feed to
                discover developers and start connecting!
              </p>
              <div className="pt-2">
                <Link to="/" className="btn btn-primary shadow-md">
                  Explore Feed
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty State: Search Query Yielded No Results */}
        {!loading &&
          connections &&
          connections.length > 0 &&
          filteredConnections.length === 0 && (
            <div className="card bg-base-100 border border-base-300 shadow-sm text-center py-12 px-6">
              <div className="max-w-md mx-auto space-y-3">
                <div className="text-4xl">🔍</div>
                <h3 className="text-lg font-semibold">No matches found</h3>
                <p className="text-sm text-base-content/60">
                  No connected developers found matching &quot;{searchQuery}&quot;.
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

        {/* Connections Grid */}
        {filteredConnections && filteredConnections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnections.map((item, index) => {
              const user = getConnectedUser(item);
              if (!user) return null;
              const skills = Array.isArray(user.skills)
                ? user.skills
                : typeof user.skills === "string" && user.skills
                ? user.skills.split(",").map((s) => s.trim())
                : [];

              return (
                <div
                  key={user._id || index}
                  className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Top row: Avatar & Identity */}
                    <div className="flex items-start gap-4">
                      <div className="avatar shrink-0">
                        <div className="w-16 h-16 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100 overflow-hidden">
                          <img
                            src={
                              user.photoURL ||
                              user.photoUrl ||
                              DEFAULT_USER_AVATAR
                            }
                            alt={`${user.firstName || "User"} ${
                              user.lastName || ""
                            }`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_USER_AVATAR;
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold truncate leading-tight">
                          {user.firstName} {user.lastName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          {user.age && (
                            <span className="text-xs text-base-content/70">
                              {user.age} yrs
                            </span>
                          )}
                          {user.gender && (
                            <span className="badge badge-sm badge-ghost capitalize text-xs">
                              {user.gender}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-success font-medium mt-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-success"></span>
                          Connected
                        </div>
                      </div>
                    </div>

                    {/* About Section */}
                    {user.about && (
                      <p className="text-sm text-base-content/80 line-clamp-3 leading-relaxed">
                        {user.about}
                      </p>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                          Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                          {skills.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className={`badge badge-outline badge-xs sm:badge-sm ${
                                SKILLS_COLORS[sIdx % SKILLS_COLORS.length]
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Footer actions */}
                  <div className="border-t border-base-200 px-5 py-3 bg-base-200/30 flex items-center justify-between">
                    <span className="text-xs text-base-content/50">
                      DevTinder Member
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-xs btn-primary btn-outline gap-1"
                        onClick={() => {
                          // Placeholder for messaging or future chat integration
                          alert(`Chat with ${user.firstName} coming soon!`);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
