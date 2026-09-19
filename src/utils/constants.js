// Determine API base URL based on environment:
//  - VITE_BASE_URL env variable (highest priority, set in Netlify/Vercel dashboard)
//  - localhost → local Express server
//  - EC2 IP    → Nginx reverse proxy on same host, so /api works
//  - Netlify   → completely separate host, must point directly to EC2 backend
export const BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  (location.hostname === "localhost"
    ? "http://localhost:7777"
    : location.hostname === "13.61.17.142"
    ? "/api"
    : "http://13.61.17.142/api"); // Netlify & other deployments → point to EC2

export const DEFAULT_USER_AVATAR =
  "https://media.istockphoto.com/id/1451587807/vector/user-profile-icon-vector-avatar-or-person-icon-profile-picture-portrait-symbol-vector.jpg?s=2048x2048&w=is&k=20&c=-g-2McKwLpsyYHPDT3Wf1oo2ppTmNxq797heiFJmwSM=";
