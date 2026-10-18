// Determine API base URL based on environment:
//  - VITE_BASE_URL env variable (highest priority, if explicitly provided)
//  - localhost / 127.0.0.1 → direct local Express server (http://localhost:7777)
//  - EC2 / Netlify / Production → /api (rewritten transparently by Netlify proxy to DuckDNS)
export const BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  (location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:7777"
    : "/api");

import axios from "axios";

// Automatically attach Bearer token from localStorage to EVERY outgoing request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("devtinder_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const DEFAULT_USER_AVATAR = "/firstTimeUser.jpg";

export const getCleanAvatar = (url) => {
  if (!url || typeof url !== "string" || url.includes("istockphoto.com")) {
    return DEFAULT_USER_AVATAR;
  }
  return url;
};
