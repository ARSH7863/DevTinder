import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { DEFAULT_USER_AVATAR } from "../utils/constants";

const MatchCelebrationModal = ({ isOpen, onClose, matchedUser, currentUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    // Trigger multi-stage celebratory confetti
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    // Initial burst from sides
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0.1, y: 0.7 },
      colors: ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"],
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 0.9, y: 0.7 },
      colors: ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"],
    });

    const interval = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: Math.random() * 0.6 + 0.2,
          y: Math.random() * 0.4 + 0.2,
        },
        colors: ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"],
      });
    }, 450);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !matchedUser) return null;

  const currentAvatar =
    currentUser?.photoURL || currentUser?.photoUrl || DEFAULT_USER_AVATAR;
  const matchedAvatar =
    matchedUser?.photoURL || matchedUser?.photoUrl || DEFAULT_USER_AVATAR;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="It's a Match!"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-base-100 via-base-100 to-base-200 border border-primary/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/60 hover:text-base-content"
          aria-label="Close match celebration"
        >
          ✕
        </button>

        {/* Animated Headline */}
        <div className="mt-2 mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30 mb-2 uppercase tracking-widest">
            🎉 Mutual Connection!
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent drop-shadow">
            It&apos;s a Match!
          </h2>
          <p className="text-sm text-base-content/70 mt-2 max-w-xs mx-auto">
            You and <span className="font-semibold text-base-content">{matchedUser.firstName} {matchedUser.lastName}</span> want to connect!
          </p>
        </div>

        {/* Avatar Pair with Pulsing Heart Connection */}
        <div className="relative flex items-center justify-center gap-6 my-4">
          {/* Current User Avatar */}
          <div className="avatar">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-primary/80 ring-offset-4 ring-offset-base-100 shadow-xl overflow-hidden transform -rotate-6 transition-transform hover:rotate-0">
              <img
                src={currentAvatar}
                alt={currentUser?.firstName || "You"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_USER_AVATAR;
                }}
              />
            </div>
          </div>

          {/* Heart / Sparkle connector badge */}
          <div className="z-10 -mx-3 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-500/50 animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          {/* Matched User Avatar */}
          <div className="avatar">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-secondary/80 ring-offset-4 ring-offset-base-100 shadow-xl overflow-hidden transform rotate-6 transition-transform hover:rotate-0">
              <img
                src={matchedAvatar}
                alt={matchedUser?.firstName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_USER_AVATAR;
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 mt-6">
          <button
            onClick={() => {
              onClose();
              navigate("/connections");
            }}
            className="btn btn-primary w-full shadow-lg shadow-primary/30 flex items-center justify-center gap-2 text-base font-semibold"
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Send a Message
          </button>

          <button
            onClick={onClose}
            className="btn btn-ghost w-full text-base-content/70 hover:text-base-content"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCelebrationModal;
