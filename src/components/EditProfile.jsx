import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { BASE_URL, DEFAULT_USER_AVATAR } from "../utils/constants";
import { addUser } from "../utils/userSlice";

// ─── Change Password Card ────────────────────────────────────────────────────
const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    setError("");
    setSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All three password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (newPassword === oldPassword) {
      setError("New password must be different from the old password.");
      return;
    }

    setLoading(true);
    try {
      await axios.patch(
        `${BASE_URL}/profile/password`,
        { oldPassword, newPassword },
        { withCredentials: true }
      );
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to change password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ label, value, onChange, show, onToggle, id }) => (
    <fieldset className="fieldset py-0 mt-2">
      <legend className="fieldset-legend text-xs font-semibold">{label}</legend>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="input input-bordered input-sm w-full pr-16"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content transition-colors px-1"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </fieldset>
  );

  return (
    <div className="card bg-base-100 w-full max-w-lg shadow-xl border border-base-300 mt-6">
      <div className="card-body p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔒</span>
          <h2 className="card-title text-xl font-bold">Change Password</h2>
        </div>

        {error && (
          <div role="alert" className="alert alert-error text-xs p-3 rounded-lg mb-2">
            <span>{error}</span>
          </div>
        )}

        <PasswordField
          id="old-password"
          label="Current Password"
          value={oldPassword}
          onChange={setOldPassword}
          show={showOld}
          onToggle={() => setShowOld((p) => !p)}
        />
        <PasswordField
          id="new-password"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((p) => !p)}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm((p) => !p)}
        />

        <p className="text-xs text-base-content/50 mt-2">
          Password must contain uppercase, lowercase, number and special character.
        </p>

        <div className="card-actions justify-end mt-4">
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="btn btn-warning btn-sm px-6 shadow"
          >
            {loading && <span className="loading loading-spinner loading-xs" />}
            Update Password
          </button>
        </div>
      </div>

      {success && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success text-sm py-2 px-4 shadow-lg text-white">
            <span>🔐 Password updated! Please log in again.</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Edit Profile Card ───────────────────────────────────────────────────────
const EditProfile = ({ user }) => {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL || user?.photoUrl || "");
  const [age, setAge] = useState(user?.age || "");
  const [gender, setGender] = useState(user?.gender?.toLowerCase() || "");
  const [about, setAbout] = useState(user?.about || "");
  const [skills, setSkills] = useState(
    Array.isArray(user?.skills) ? user?.skills.join(", ") : user?.skills || ""
  );
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const handleSave = async () => {
    setError("");
    setLoading(true);
    try {
      const skillsArray = skills
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        firstName,
        lastName,
        photoURL: photoUrl,
        about,
        skills: skillsArray,
      };
      if (age) payload.age = Number(age);
      if (gender) payload.gender = gender;

      const res = await axios.patch(
        `${BASE_URL}/profile/edit`,
        payload,
        { withCredentials: true }
      );

      dispatch(addUser(res?.data?.data || res?.data?.user || res?.data));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      const errMsg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to update profile";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-8 p-6 max-w-6xl mx-auto w-full">
      {/* Left column: Edit Profile + Change Password stacked */}
      <div className="flex flex-col w-full max-w-lg">
        {/* Edit Profile Form Card */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✏️</span>
              <h2 className="card-title text-xl font-bold">Edit Profile</h2>
            </div>

            {error && (
              <div role="alert" className="alert alert-error text-xs p-3 rounded-lg mb-2">
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <fieldset className="fieldset py-0">
                <legend className="fieldset-legend text-xs font-semibold">First Name</legend>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                />
              </fieldset>

              <fieldset className="fieldset py-0">
                <legend className="fieldset-legend text-xs font-semibold">Last Name</legend>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                />
              </fieldset>
            </div>

            <fieldset className="fieldset py-0 mt-2">
              <legend className="fieldset-legend text-xs font-semibold">Photo URL</legend>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </fieldset>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <fieldset className="fieldset py-0">
                <legend className="fieldset-legend text-xs font-semibold">Age</legend>
                <input
                  type="number"
                  className="input input-bordered input-sm w-full"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                />
              </fieldset>

              <fieldset className="fieldset py-0">
                <legend className="fieldset-legend text-xs font-semibold">Gender</legend>
                <select
                  className="select select-bordered select-sm w-full"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </fieldset>
            </div>

            <fieldset className="fieldset py-0 mt-2">
              <legend className="fieldset-legend text-xs font-semibold">About / Bio</legend>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full"
                rows={2}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Passionate Full Stack Developer..."
              />
            </fieldset>

            <fieldset className="fieldset py-0 mt-2">
              <legend className="fieldset-legend text-xs font-semibold">Skills (comma separated)</legend>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, JavaScript, MongoDB"
              />
            </fieldset>

            <div className="card-actions justify-end mt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary btn-sm px-6 shadow"
              >
                {loading && <span className="loading loading-spinner loading-xs" />}
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Card — directly below */}
        <ChangePassword />
      </div>

      {/* Live Preview Card */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">Live Preview</span>
        <div className="card bg-base-100 w-80 shadow-2xl border border-base-300 overflow-hidden">
          <figure className="h-60 bg-base-200 overflow-hidden">
            <img
              src={photoUrl || DEFAULT_USER_AVATAR}
              alt={`${firstName} ${lastName}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_USER_AVATAR;
              }}
            />
          </figure>
          <div className="card-body p-4">
            <h2 className="card-title text-lg">
              {firstName || "First"} {lastName || "Last"}
              {age && <span className="text-sm font-normal text-base-content/70">, {age}</span>}
            </h2>
            {gender && (
              <div className="badge badge-outline badge-sm capitalize">{gender}</div>
            )}
            <p className="text-xs text-base-content/80 mt-1 line-clamp-3">
              {about || "No bio added yet."}
            </p>
            {skills && (
              <div className="flex flex-wrap gap-1 mt-2">
                {skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((skill, idx) => (
                    <span key={idx} className="badge badge-primary badge-outline badge-xs">
                      {skill}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success text-sm py-2 px-4 shadow-lg text-white">
            <span>🎉 Profile updated successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;
