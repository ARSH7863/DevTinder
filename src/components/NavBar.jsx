import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { BASE_URL, DEFAULT_USER_AVATAR } from "../utils/constants";
import { removeUser } from "../utils/userSlice";
import { removeConnections } from "../utils/connectionSlice";
import { addRequests, clearRequests } from "../utils/requestSlice";
import useTheme from "../utils/useTheme";

const NavBar = () => {
  const user = useSelector((store) => store.user);
  const requests = useSelector((store) => store.requests);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [spinning, setSpinning] = useState(false);

  const handleThemeToggle = () => {
    if (spinning) return;
    toggleTheme();
    setSpinning(true);
    setTimeout(() => setSpinning(false), 500);
  };

  // Fetch pending connection requests as soon as user logs in or session is restored
  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/user/requests/received`, {
          withCredentials: true,
        });
        const data = res?.data?.data || res?.data || [];
        dispatch(addRequests(Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("Failed to fetch requests in navbar:", err);
      }
    };

    fetchRequests();
  }, [user, dispatch]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${BASE_URL}/logout`,
        {},
        {
          withCredentials: true,
        },
      );
      dispatch(removeUser());
      dispatch(removeConnections());
      dispatch(clearRequests());
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      <div className="navbar bg-base-200 shadow-sm">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">
            👨‍💻DevTinder
          </Link>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          title="Toggle theme"
          className="btn btn-ghost btn-circle mx-1 relative overflow-hidden"
          style={{ transition: "background 0.3s" }}
        >
          {/* Glow ring burst on toggle */}
          {spinning && (
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  theme === "light"
                    ? "radial-gradient(circle, rgba(250,204,21,0.55) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(148,163,184,0.45) 0%, transparent 70%)",
                animation: "themePulse 0.5s ease-out forwards",
                pointerEvents: "none",
              }}
            />
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current"
            style={{
              display: "block",
              animation: spinning ? "themeSpin 0.5s cubic-bezier(.4,0,.2,1) forwards" : "none",
              transformOrigin: "center",
            }}
          >
            {theme === "dark" ? (
              /* Moon — dark mode */
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            ) : (
              /* Sun — light mode */
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            )}
          </svg>
          <style>{`
            @keyframes themeSpin {
              0%   { transform: rotate(0deg) scale(1); }
              40%  { transform: rotate(200deg) scale(1.3); }
              100% { transform: rotate(360deg) scale(1); }
            }
            @keyframes themePulse {
              0%   { opacity: 1; transform: scale(0.5); }
              100% { opacity: 0; transform: scale(2.2); }
            }
          `}</style>
        </button>

        {/* Requests Bell — visible in navbar when logged in */}
        {user && (
          <Link
            to="/requests"
            className="btn btn-ghost btn-circle relative"
            title="Requests"
          >
            {/* Bell icon */}
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {requests && requests.length > 0 && (
              <span className="absolute -top-1 -right-1 badge badge-secondary badge-xs min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-[10px] font-bold">
                {requests.length}
              </span>
            )}
          </Link>
        )}

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              Welcome, {user?.firstName}
            </span>
            <div className="dropdown dropdown-end mx-5">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full">
                  <img
                    alt="User avatar"
                    src={
                      user?.photoURL || user?.photoUrl || DEFAULT_USER_AVATAR
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_USER_AVATAR;
                    }}
                  />
                </div>
              </div>
              <ul
                tabIndex="-1"
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
              >
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
                <li>
                  <Link to="/connections">Connections</Link>
                </li>
                <li>
                  <a onClick={handleLogout}>Logout</a>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NavBar;
