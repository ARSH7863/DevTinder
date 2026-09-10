import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { clearFeed } from "../utils/feedSlice";
import { clearRequests, addRequests } from "../utils/requestSlice";
import { removeConnections } from "../utils/connectionSlice";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      // Clear any stale data from a previous session before logging in
      dispatch(clearFeed());
      dispatch(clearRequests());
      dispatch(removeConnections());
      const res = await axios.post(
        `${BASE_URL}/login`,
        { emailId, password },
        { withCredentials: true },
      );
      dispatch(addUser(res?.data?.user || res.data));
      navigate("/");
    } catch (err) {
      setError(err?.response?.data || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setError("");
      setLoading(true);
      // Clear any stale state before creating new session
      dispatch(clearFeed());
      dispatch(clearRequests());
      dispatch(removeConnections());

      // 1. Create the new user in backend
      await axios.post(
        `${BASE_URL}/signup`,
        { firstName, lastName, emailId, password },
        { withCredentials: true },
      );

      // 2. Automatically log them in so backend sets the JWT session cookie
      const loginRes = await axios.post(
        `${BASE_URL}/login`,
        { emailId, password },
        { withCredentials: true },
      );

      const user = loginRes?.data?.user || loginRes?.data;
      dispatch(addUser(user));

      // 3. Pre-fetch requests so bell badge is ready
      try {
        const reqRes = await axios.get(`${BASE_URL}/user/requests/received`, {
          withCredentials: true,
        });
        const reqData = reqRes?.data?.data || reqRes?.data || [];
        dispatch(addRequests(Array.isArray(reqData) ? reqData : []));
      } catch (_) {
        // Non-critical
      }

      navigate("/");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err?.response?.data : null) ||
        err.message ||
        "Signup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="hero flex-1 bg-base-200/50 py-4 px-4">
      <div className="hero-content flex-col w-full max-w-sm p-0">
        {/* Brand Header */}
        <div className="text-center">
          <div className="avatar placeholder mb-1">
            <div className="bg-primary text-primary-content rounded-xl w-11 shadow-md ring ring-primary ring-offset-base-100 ring-offset-2">
              <span className="text-xl font-bold">💻</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {isSignUp ? "Join DevTinder" : "Welcome Back"}
          </h1>
          <p className="text-xs text-base-content/70">
            {isSignUp
              ? "Discover & match with fellow developers"
              : "Find your next code pairing partner"}
          </p>
        </div>

        {/* DaisyUI Card */}
        <div className="card w-full bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-5">
            {/* Error Alert */}
            {error && (
              <div
                role="alert"
                className="alert alert-error text-xs p-2.5 rounded-lg mb-2 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0 stroke-current"
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
                <span>{error}</span>
              </div>
            )}

            {/* DaisyUI Tabs */}
            <div
              role="tablist"
              className="tabs tabs-box bg-base-200 mb-3 p-1 rounded-xl"
            >
              <button
                type="button"
                role="tab"
                className={`tab flex-1 font-semibold text-xs transition-all rounded-lg ${
                  !isSignUp ? "tab-active bg-primary text-primary-content" : ""
                }`}
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                }}
              >
                Log In
              </button>
              <button
                type="button"
                role="tab"
                className={`tab flex-1 font-semibold text-xs transition-all rounded-lg ${
                  isSignUp ? "tab-active bg-primary text-primary-content" : ""
                }`}
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Form using DaisyUI Fieldset */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              {isSignUp && (
                <div className="grid grid-cols-2 gap-2">
                  <fieldset className="fieldset py-0">
                    <legend className="fieldset-legend text-[11px] font-semibold py-0.5">
                      First Name
                    </legend>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      placeholder="Linus"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={isSignUp}
                    />
                  </fieldset>
                  <fieldset className="fieldset py-0">
                    <legend className="fieldset-legend text-[11px] font-semibold py-0.5">
                      Last Name
                    </legend>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      placeholder="Torvalds"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={isSignUp}
                    />
                  </fieldset>
                </div>
              )}

              {/* Email with DaisyUI fieldset */}
              <fieldset className="fieldset py-0">
                <legend className="fieldset-legend text-[11px] font-semibold py-0.5">
                  Email Address
                </legend>
                <label className="input input-bordered input-sm flex items-center gap-2 w-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70"
                  >
                    <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                    <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                  </svg>
                  <input
                    type="email"
                    className="grow text-xs"
                    placeholder="dev@example.com"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    required
                  />
                </label>
              </fieldset>

              {/* Password with DaisyUI fieldset */}
              <fieldset className="fieldset py-0">
                <div className="flex justify-between items-center w-full py-0.5">
                  <legend className="fieldset-legend text-[11px] font-semibold py-0">
                    Password
                  </legend>
                  {!isSignUp && (
                    <a
                      href="#forgot"
                      className="link link-primary link-hover text-[11px] font-medium"
                    >
                      Forgot?
                    </a>
                  )}
                </div>
                <label className="input input-bordered input-sm flex items-center gap-2 w-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="grow text-xs"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-[10px] opacity-70 hover:opacity-100"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </label>
              </fieldset>

              {/* Action Button */}
              <div className="card-actions mt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-sm btn-block shadow-md"
                >
                  {loading && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                  {isSignUp ? "Create Account" : "Sign In"}
                </button>
              </div>
            </form>

            {/* DaisyUI Divider */}
            <div className="divider text-[10px] uppercase font-semibold opacity-50 my-1">
              OR
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn btn-outline btn-xs h-8 gap-1.5 font-medium"
              >
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs h-8 gap-1.5 font-medium"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                Google
              </button>
            </div>

            {/* Toggle Switcher */}
            <div className="text-center mt-1 text-xs text-base-content/70">
              {isSignUp ? "Already registered? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="link link-primary font-semibold"
              >
                {isSignUp ? "Log In" : "Sign Up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
