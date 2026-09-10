import { useEffect } from "react";
import { DEFAULT_USER_AVATAR } from "../utils/constants";

const SKILLS_COLORS = [
  "badge-primary",
  "badge-secondary",
  "badge-accent",
  "badge-info",
  "badge-success",
  "badge-warning",
];

const UserDetailsModal = ({
  user,
  isOpen,
  onClose,
  onLike,
  onSkip,
  actionLoading,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const skills = Array.isArray(user.skills)
    ? user.skills
    : typeof user.skills === "string" && user.skills
    ? user.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const photo = user.photoURL || user.photoUrl || DEFAULT_USER_AVATAR;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle bg-black/60 hover:bg-black/80 text-white border-0 absolute right-4 top-4 z-20 shadow-md"
          aria-label="Close details"
        >
          ✕
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Hero Image Section */}
          <div className="relative h-64 sm:h-80 w-full bg-base-300 overflow-hidden">
            <img
              src={photo}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_USER_AVATAR;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-black/40" />

            {/* Name, Age, and Gender on bottom of image */}
            <div className="absolute bottom-4 left-6 right-6">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2
                  id="user-details-title"
                  className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md"
                >
                  {user.firstName} {user.lastName}
                </h2>
                {user.age && (
                  <span className="text-xl text-white/90 font-light">
                    {user.age}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                {user.gender && (
                  <span className="badge badge-sm badge-neutral capitalize font-medium">
                    {user.gender}
                  </span>
                )}
                <span className="badge badge-sm badge-primary badge-outline">
                  Developer
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-6">
            {/* About / Bio */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                About Developer
              </h3>
              <p className="text-sm sm:text-base text-base-content/85 leading-relaxed whitespace-pre-line bg-base-200/50 p-4 rounded-2xl border border-base-200">
                {user.about || "No bio provided yet."}
              </p>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2.5 flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  Tech Stack &amp; Skills ({skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className={`badge badge-md badge-outline px-3 py-1 font-medium ${
                        SKILLS_COLORS[idx % SKILLS_COLORS.length]
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social / External Links (if any exist on user model) */}
            {(user.githubUrl || user.linkedinUrl || user.portfolioUrl) && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">
                  Links &amp; Profiles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.githubUrl && (
                    <a
                      href={user.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline gap-2"
                    >
                      GitHub
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline btn-info gap-2"
                    >
                      LinkedIn
                    </a>
                  )}
                  {user.portfolioUrl && (
                    <a
                      href={user.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline btn-accent gap-2"
                    >
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Swipe Action Controls */}
        <div className="p-4 border-t border-base-200 bg-base-200/40 flex items-center justify-around gap-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSkip();
            }}
            disabled={actionLoading}
            className="btn btn-outline border-2 border-error text-error hover:bg-error hover:text-white flex-1 rounded-2xl h-12 gap-2 shadow-sm cursor-pointer"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="font-bold">Pass</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLike();
            }}
            disabled={actionLoading}
            className="btn btn-primary flex-1 rounded-2xl h-12 gap-2 shadow-md shadow-primary/20 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-bold">Connect</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
