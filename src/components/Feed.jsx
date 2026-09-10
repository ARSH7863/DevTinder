import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BASE_URL, DEFAULT_USER_AVATAR } from "../utils/constants";
import { addFeed, removeUserFromFeed, restoreUserToFeed } from "../utils/feedSlice";
import { removeUser } from "../utils/userSlice";
import { sendConnectionRequest } from "../utils/requestApi";
import MatchCelebrationModal from "./MatchCelebrationModal";
import UserDetailsModal from "./UserDetailsModal";
import Tooltip from "./Tooltip";

const SKILLS_COLORS = [
  "badge-primary",
  "badge-secondary",
  "badge-accent",
  "badge-info",
  "badge-success",
  "badge-warning",
];

// Inject keyframes once
const SWIPE_STYLE_ID = "swipe-card-keyframes";
if (!document.getElementById(SWIPE_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = SWIPE_STYLE_ID;
  style.textContent = `
    @keyframes flyLeft {
      to { transform: translateX(-140vw) rotate(-30deg); opacity: 0; }
    }
    @keyframes flyRight {
      to { transform: translateX(140vw) rotate(30deg); opacity: 0; }
    }
    @keyframes cardEntrance {
      from { transform: scale(0.95) translateY(9px); opacity: 0.85; }
      to   { transform: scale(1) translateY(0); opacity: 1; }
    }
    .swipe-card {
      animation: cardEntrance 0.3s cubic-bezier(.22,1,.36,1) both;
      touch-action: none;
      will-change: transform;
      user-select: none;
    }
    .fly-left  { animation: flyLeft  0.34s cubic-bezier(.55,0,1,.7) forwards !important; }
    .fly-right { animation: flyRight 0.34s cubic-bezier(.55,0,1,.7) forwards !important; }
  `;
  document.head.appendChild(style);
}

const SWIPE_THRESHOLD = 100; // px to trigger action

const UserCard = forwardRef(
  (
    {
      user,
      onLike,
      onSkip,
      onUndo,
      canUndo,
      onOpenDetails,
      actionLoading,
    },
    ref
  ) => {
    const cardRef = useRef(null);
    const startX = useRef(0);
    const startY = useRef(0);
    const currentX = useRef(0);
    const isDragging = useRef(false);
    const dragDistance = useRef(0);
    const [dragX, setDragX] = useState(0);
    const [animating, setAnimating] = useState(false);

    const skills = Array.isArray(user?.skills) ? user.skills : [];

    // Derived values from drag position
    const rotation = dragX * 0.12; // max ~12° at threshold
    const likeOpacity = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1);
    const nopeOpacity = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1);

    const resetCard = () => {
      setDragX(0);
      isDragging.current = false;
      if (cardRef.current) {
        cardRef.current.style.transform = "";
        cardRef.current.style.transition = "transform 0.4s cubic-bezier(.22,1,.36,1)";
        setTimeout(() => {
          if (cardRef.current) cardRef.current.style.transition = "";
        }, 400);
      }
    };

    const flyAndAct = (direction, action) => {
      if (animating || !cardRef.current) return;
      setAnimating(true);
      cardRef.current.style.transform = "";
      cardRef.current.classList.add(direction === "right" ? "fly-right" : "fly-left");
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.classList.remove("fly-right", "fly-left");
          cardRef.current.style.transform = "";
        }
        setAnimating(false);
        action();
      }, 320);
    };

    // Expose fly actions for external triggers (like desktop keyboard shortcuts)
    useImperativeHandle(ref, () => ({
      flyLeft: () => flyAndAct("left", onSkip),
      flyRight: () => flyAndAct("right", onLike),
      isAnimating: () => animating,
    }));

    // Pointer events for drag
    const onPointerDown = (e) => {
      // If the click/touch is on or inside the action buttons, let the button handle it
      if (e.target.closest("button") || e.target.closest(".feed-actions")) return;
      if (animating || actionLoading) return;
      isDragging.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
      currentX.current = 0;
      dragDistance.current = 0;
      cardRef.current?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      currentX.current = dx;
      dragDistance.current = Math.hypot(dx, dy);
      setDragX(dx);
      if (cardRef.current) {
        const rot = dx * 0.12;
        cardRef.current.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
        cardRef.current.style.transition = "none";
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const dx = currentX.current;

      // If user tapped without dragging, trigger expand details
      if (dragDistance.current < 8 && !e.target.closest("button")) {
        resetCard();
        onOpenDetails?.();
        return;
      }

      if (dx > SWIPE_THRESHOLD) {
        flyAndAct("right", onLike);
      } else if (dx < -SWIPE_THRESHOLD) {
        flyAndAct("left", onSkip);
      } else {
        resetCard();
      }
      setDragX(0);
    };

    return (
      <div
        ref={cardRef}
        className="swipe-card card bg-base-100 shadow-2xl w-80 sm:w-96 border border-base-300 rounded-3xl overflow-visible cursor-grab active:cursor-grabbing group"
        style={{ position: "relative" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* LIKE stamp */}
        <div
          className="absolute top-8 left-5 z-10 pointer-events-none select-none"
          style={{
            opacity: likeOpacity,
            transform: "rotate(-15deg)",
            border: "4px solid #22c55e",
            color: "#22c55e",
            padding: "4px 12px",
            borderRadius: "6px",
            fontWeight: 900,
            fontSize: "2rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            lineHeight: 1,
            transition: "opacity 0.05s",
            textShadow: "0 0 8px #22c55e44",
          }}
        >
          LIKE
        </div>

        {/* NOPE stamp */}
        <div
          className="absolute top-8 right-5 z-10 pointer-events-none select-none"
          style={{
            opacity: nopeOpacity,
            transform: "rotate(15deg)",
            border: "4px solid #ef4444",
            color: "#ef4444",
            padding: "4px 12px",
            borderRadius: "6px",
            fontWeight: 900,
            fontSize: "2rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            lineHeight: 1,
            transition: "opacity 0.05s",
            textShadow: "0 0 8px #ef444444",
          }}
        >
          NOPE
        </div>

        {/* Photo */}
        <figure className="relative h-72 bg-base-200 overflow-hidden rounded-t-3xl pointer-events-none">
          <img
            src={user?.photoURL || user?.photoUrl || DEFAULT_USER_AVATAR}
            alt={`${user?.firstName} ${user?.lastName}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            draggable={false}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_USER_AVATAR;
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

          {/* Quick Info Pill in Top Right */}
          <div className="absolute top-3 right-3 pointer-events-auto">
            <Tooltip text="View full bio & skills" kbd="Space" color="neutral" position="bottom">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails?.();
                }}
                className="badge badge-neutral/85 hover:badge-primary text-xs py-2.5 px-2.5 gap-1 shadow-md backdrop-blur-sm cursor-pointer transition-all hover:scale-105"
                aria-label="Expand Bio"
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
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Info</span>
              </button>
            </Tooltip>
          </div>

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
            <div
              className="cursor-pointer group/about"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails?.();
              }}
              title="Click to expand bio"
            >
              <p className="text-sm text-base-content/80 line-clamp-2 leading-snug group-hover/about:text-primary transition-colors">
                {user.about}
              </p>
              <span className="text-xs text-primary font-medium opacity-80 group-hover/about:underline">
                Read full bio →
              </span>
            </div>
          )}

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className={`badge badge-outline badge-sm ${SKILLS_COLORS[idx % SKILLS_COLORS.length]}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div
            className="feed-actions flex items-center justify-center gap-3 sm:gap-4 mt-3 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Tinder-style Undo / Rewind Button */}
            <Tooltip
              text={canUndo ? "Undo last swipe" : "No swipes to undo"}
              kbd={canUndo ? "⌫" : undefined}
              color="warning"
              position="top"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={!canUndo || animating}
                className={`btn btn-circle btn-outline border-2 border-warning text-warning hover:bg-warning hover:text-black w-12 h-12 shadow-sm transition-all duration-200 ${
                  canUndo
                    ? "hover:scale-110 active:scale-95 cursor-pointer"
                    : "opacity-35 cursor-not-allowed hover:bg-transparent hover:text-warning"
                }`}
                aria-label="Undo last swipe"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h10a5 5 0 015 5v2M3 10l5-5m-5 5l5 5"
                  />
                </svg>
              </button>
            </Tooltip>

            {/* Skip / Pass */}
            <Tooltip text="Skip developer" kbd="←" color="error" position="top">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  flyAndAct("left", onSkip);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={animating}
                className="btn btn-circle btn-outline border-2 border-error text-error hover:bg-error hover:text-white hover:border-error w-14 h-14 shadow-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Skip developer"
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </Tooltip>

            {/* Details / Info Button */}
            <Tooltip text="Inspect profile & bio" kbd="Space" color="info" position="top">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails?.();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="btn btn-circle btn-outline border-2 border-info text-info hover:bg-info hover:text-white hover:border-info w-12 h-12 shadow-sm transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Inspect developer profile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </Tooltip>

            {/* Like / Connect */}
            <Tooltip text="Connect" kbd="→" color="success" position="top">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  flyAndAct("right", onLike);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={animating}
                className="btn btn-circle btn-outline border-2 border-success text-success hover:bg-success hover:text-white hover:border-success w-14 h-14 shadow-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Connect with developer"
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
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
);

UserCard.displayName = "UserCard";

const PreviewCard = ({ user }) => {
  const skills = Array.isArray(user?.skills) ? user.skills : [];

  return (
    <div
      className="card bg-base-100 shadow-xl w-80 sm:w-96 border border-base-300 overflow-hidden pointer-events-none absolute inset-0"
      style={{
        transform: "scale(0.95) translateY(9px)",
        transformOrigin: "bottom center",
        zIndex: 2,
        opacity: 0.85,
      }}
    >
      {/* Photo */}
      <figure className="relative h-72 bg-base-200 overflow-hidden">
        <img
          src={user?.photoURL || user?.photoUrl || DEFAULT_USER_AVATAR}
          alt={`${user?.firstName} ${user?.lastName}`}
          className="w-full h-full object-cover"
          draggable={false}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_USER_AVATAR;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
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
                className={`badge badge-outline badge-sm ${SKILLS_COLORS[idx % SKILLS_COLORS.length]}`}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Spacing placeholder matching action button area */}
        <div className="flex justify-center gap-4 mt-3 h-14" />
      </div>
    </div>
  );
};

const Feed = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const feed = useSelector((store) => store.feed);
  const loggedInUser = useSelector((store) => store.user);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // "like" | "skip" | null
  const [toast, setToast] = useState(null); // { type: "like" | "skip" | "undo" | "error", name: string, message?: string }
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState([]); // Array<{ user: User, action: "like" | "skip" }>

  // Modals state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);

  const cardRef = useRef(null);
  const LIMIT = 10;

  const fetchFeed = async (pageNum = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/user/feed?page=${pageNum}&limit=${LIMIT}`,
        { withCredentials: true, timeout: 5000 }
      );
      const data = res?.data?.data || res?.data?.users || res?.data;
      const users = Array.isArray(data) ? data : [];

      if (users.length === 0) {
        setHasMore(false);
        if (pageNum === 1) {
          dispatch(addFeed([]));
        }
      } else {
        if (pageNum === 1) {
          dispatch(addFeed(users));
        } else {
          // Append to existing feed
          dispatch(addFeed([...(feed || []), ...users]));
        }
        setHasMore(users.length === LIMIT);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
      if (err?.response?.status === 401) {
        dispatch(removeUser());
        navigate("/login");
        return;
      }
      if (pageNum === 1) dispatch(addFeed([]));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on mount if feed is empty
    if (!feed || feed.length === 0) {
      fetchFeed(1);
    }
  }, []);

  // Safeguard: Stop loader after 5000ms if stuck loading with 0 developers
  useEffect(() => {
    let timer;
    if (loading && (!feed || feed.length === 0)) {
      timer = setTimeout(() => {
        setTimedOut(true);
        setLoading(false);
      }, 5000);
    } else if (feed && feed.length > 0) {
      setTimedOut(false);
    }
    return () => clearTimeout(timer);
  }, [loading, feed]);

  // Auto-fetch next page when feed runs out but more pages exist
  useEffect(() => {
    if (feed !== null && feed.length === 0 && hasMore && !loading) {
      fetchFeed(page + 1);
    }
  }, [feed]);

  const showToast = (type, name, message) => {
    setToast({ type, name, message });
    setTimeout(() => setToast(null), 2500);
  };

  const currentUser = feed?.[0];

  const handleLike = async (userId, firstName) => {
    if (!currentUser) return;
    // Record into swipe history for Undo
    setSwipeHistory((prev) => [{ user: currentUser, action: "like" }, ...prev]);
    // Optimistic removal: transition to next card immediately
    dispatch(removeUserFromFeed(userId));
    showToast("like", firstName);
    setActionLoading("like");

    try {
      const res = await sendConnectionRequest("interested", userId);
      // Check if this formed a mutual connection / match
      const isMutualMatch =
        res?.data?.data?.status === "accepted" ||
        res?.data?.status === "accepted" ||
        res?.data?.isMatch === true ||
        (typeof res?.data?.message === "string" &&
          res.data.message.toLowerCase().includes("match"));

      if (isMutualMatch) {
        setMatchedUser(currentUser);
        setIsMatchModalOpen(true);
      }
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
    if (!currentUser) return;
    // Record into swipe history for Undo
    setSwipeHistory((prev) => [{ user: currentUser, action: "skip" }, ...prev]);
    // Optimistic removal: transition to next card immediately
    dispatch(removeUserFromFeed(userId));
    showToast("skip", firstName);
    setActionLoading("skip");

    try {
      await sendConnectionRequest("ignored", userId);
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

  // Undo / Rewind last swipe
  const handleUndo = () => {
    if (swipeHistory.length === 0) return;
    const [lastSwiped, ...remainingHistory] = swipeHistory;
    setSwipeHistory(remainingHistory);
    dispatch(restoreUserToFeed(lastSwiped.user));
    showToast("undo", lastSwiped.user.firstName);
  };

  // Keep latest references for keyboard events without rebuilding listener unnecessarily
  const stateRef = useRef({
    currentUser,
    isDetailsOpen,
    isMatchModalOpen,
    handleUndo,
  });
  stateRef.current = {
    currentUser,
    isDetailsOpen,
    isMatchModalOpen,
    handleUndo,
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Guard: Ignore shortcuts when user is actively typing in an input or textarea
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      if (isInputActive) return;

      const {
        currentUser: current,
        isDetailsOpen: detailsOpen,
        isMatchModalOpen: matchOpen,
        handleUndo: undoAction,
      } = stateRef.current;

      // When modals are open, handle their keys
      if (matchOpen) {
        if (e.key === "Escape") {
          setIsMatchModalOpen(false);
        }
        return;
      }

      if (detailsOpen) {
        if (e.key === "Escape" || e.code === "Space") {
          e.preventDefault();
          setIsDetailsOpen(false);
        }
        return;
      }

      // No modal open: Main Feed shortcuts
      if (!current) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cardRef.current?.flyLeft();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        cardRef.current?.flyRight();
      } else if (e.code === "Space") {
        e.preventDefault();
        setIsDetailsOpen(true);
      } else if (e.key === "Backspace" || e.key === "z" || e.key === "Z") {
        e.preventDefault();
        undoAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 1. Only show "No developers found" if feed is ACTUALLY empty
  if ((!feed || feed.length === 0) && (timedOut || (!hasMore && feed !== null)) && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-200/40 py-8 px-4">
        <div className="text-center flex flex-col items-center gap-3 p-8">
          <div className="text-6xl">🔍</div>
          <h2 className="text-2xl font-bold">No developers found</h2>
          <p className="text-base-content/60 text-sm max-w-xs">
            No developers to discover right now. Check back later for new connections.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <button
              onClick={() => {
                setTimedOut(false);
                setHasMore(true);
                fetchFeed(1);
              }}
              className="btn btn-primary btn-sm shadow"
            >
              Refresh Feed
            </button>

            {swipeHistory.length > 0 && (
              <button
                onClick={handleUndo}
                className="btn btn-warning btn-outline btn-sm shadow"
              >
                ↩️ Undo Last Swipe
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading state: only show spinner while actively loading
  if (loading || !feed) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-200/40">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/60">
            {feed && feed.length > 0 ? "Finding more developers..." : "Finding developers for you..."}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-base-200/40 py-8 px-4 relative">
      {/* Feed Counter & Match Test Trigger */}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">
          {feed.length} developer{feed.length !== 1 ? "s" : ""} left
        </p>
        <span className="text-base-content/30">•</span>
        <Tooltip text="Preview Match Celebration Modal" color="primary" position="bottom">
          <button
            type="button"
            onClick={() => {
              setMatchedUser(currentUser);
              setIsMatchModalOpen(true);
            }}
            className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 gap-1 rounded-full"
            aria-label="Preview Match Celebration Modal"
          >
            <span>🎉 Preview Match</span>
          </button>
        </Tooltip>
      </div>

      {/* Card stack */}
      <div className="relative w-80 sm:w-96">
        {/* Ghost card 2 — furthest back */}
        {feed.length > 2 && (
          <div
            className="absolute inset-0 card bg-base-100 border border-base-300 rounded-2xl pointer-events-none"
            style={{
              transform: "scale(0.90) translateY(18px)",
              transformOrigin: "bottom center",
              zIndex: 1,
              opacity: 0.45,
            }}
          />
        )}

        {/* Preview card — next developer waiting underneath */}
        {feed.length > 1 && feed[1] && <PreviewCard user={feed[1]} />}

        {/* Active top card */}
        <div style={{ position: "relative", zIndex: 3 }}>
          <UserCard
            ref={cardRef}
            key={currentUser._id}
            user={currentUser}
            onLike={() => handleLike(currentUser._id, currentUser.firstName)}
            onSkip={() => handleSkip(currentUser._id, currentUser.firstName)}
            onUndo={handleUndo}
            canUndo={swipeHistory.length > 0}
            onOpenDetails={() => setIsDetailsOpen(true)}
            actionLoading={actionLoading}
          />
        </div>
      </div>

      {/* Desktop Keyboard Shortcuts HUD */}
      <div className="hidden md:flex items-center gap-4 mt-6 px-4 py-2 rounded-full bg-base-100/80 backdrop-blur-md border border-base-300 shadow-sm text-xs text-base-content/75 select-none">
        <span className="flex items-center gap-1.5 font-medium">
          <kbd className="kbd kbd-xs font-mono bg-base-200">←</kbd>
          <span>Skip</span>
        </span>
        <span className="text-base-content/30">•</span>
        <span className="flex items-center gap-1.5 font-medium">
          <kbd className="kbd kbd-xs font-mono bg-base-200">⌫ / Z</kbd>
          <span>Undo</span>
        </span>
        <span className="text-base-content/30">•</span>
        <span className="flex items-center gap-1.5 font-medium">
          <kbd className="kbd kbd-xs font-mono bg-base-200">Space</kbd>
          <span>Inspect Bio</span>
        </span>
        <span className="text-base-content/30">•</span>
        <span className="flex items-center gap-1.5 font-medium">
          <kbd className="kbd kbd-xs font-mono bg-base-200">→</kbd>
          <span>Connect</span>
        </span>
      </div>

      {/* Card Details / Full Bio Modal */}
      <UserDetailsModal
        user={currentUser}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onLike={() => handleLike(currentUser._id, currentUser.firstName)}
        onSkip={() => handleSkip(currentUser._id, currentUser.firstName)}
        actionLoading={actionLoading}
      />

      {/* Celebration "It's a Match!" Modal */}
      <MatchCelebrationModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        matchedUser={matchedUser}
        currentUser={loggedInUser}
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
                : toast.type === "undo"
                ? "alert-warning !text-black"
                : "alert-error"
            }`}
          >
            {toast.type === "like" && `💚 Liked ${toast.name}!`}
            {toast.type === "skip" && `👋 Skipped ${toast.name}`}
            {toast.type === "undo" && `↩️ Restored ${toast.name}'s profile`}
            {toast.type === "error" && `⚠️ ${toast.message || "Action failed"}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
