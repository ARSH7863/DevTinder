// Determine API base URL based on environment:
//  - VITE_BASE_URL env variable (highest priority, if explicitly provided)
//  - localhost / 127.0.0.1 → direct local Express server (http://localhost:7777)
//  - EC2 / Netlify / Production → /api (proxied on EC2 via Nginx, on Netlify via Netlify proxy)
export const BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  (location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:7777"
    : "/api");

export const DEFAULT_USER_AVATAR =
  "https://media.istockphoto.com/id/1451587807/vector/user-profile-icon-vector-avatar-or-person-icon-profile-picture-portrait-symbol-vector.jpg?s=2048x2048&w=is&k=20&c=-g-2McKwLpsyYHPDT3Wf1oo2ppTmNxq797heiFJmwSM=";
