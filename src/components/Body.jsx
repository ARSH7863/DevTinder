import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { BASE_URL } from "../utils/constants";
import { addUser, removeUser } from "../utils/userSlice";
import { createSocketConnection, disconnectSocket, playIncomingMessageSound } from "../utils/socket";
import { addNotification, clearLatestNotification } from "../utils/chatNotificationSlice";

const Body = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useSelector((store) => store.user);
  const latestNotification = useSelector((store) => store.chatNotifications?.latestNotification);
  const [loading, setLoading] = useState(true);

  const authChecked = useRef(false);
  const notificationToastTimerRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/profile/view`, {
        withCredentials: true,
      });
      const user = res?.data?.data || res?.data?.user || res?.data;
      dispatch(addUser(user));
      if (location.pathname === "/login") {
        navigate("/");
      }
    } catch (err) {
      dispatch(removeUser());
      if (location.pathname !== "/login") {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecked.current) {
      authChecked.current = true;
      fetchUser();
      return;
    }

    if (!userData && location.pathname !== "/login") {
      navigate("/login");
    } else if (userData && location.pathname === "/login") {
      navigate("/");
    }
  }, [userData, location.pathname]);

  // Request browser Notification permission on initial mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Global Socket.IO Connection for entire app
  useEffect(() => {
    if (!userData?._id) return;

    const socket = createSocketConnection();

    // Join personal notification room
    socket.emit("joinUser", { userId: userData._id });

    // Handle incoming notification across the entire app
    const handleNewNotification = ({ senderId, firstName, text, createdAt }) => {
      // If user is currently looking at this specific chat, do not show toast
      const currentPath = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const activeParam = searchParams.get("userId");
      const isChattingWithSender =
        currentPath.includes(`/chat/${senderId}`) ||
        (currentPath.startsWith("/chat") && (activeParam === String(senderId) || !activeParam));

      if (isChattingWithSender) return;

      const timeStr = createdAt
        ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // 1. Play WhatsApp chime sound
      playIncomingMessageSound();

      // 2. Dispatch to Redux store (updates unread count badge & triggers toast)
      dispatch(
        addNotification({
          senderId,
          firstName: firstName || "Someone",
          text,
          time: timeStr,
        })
      );

      // 3. Auto dismiss floating banner after 4.5s
      if (notificationToastTimerRef.current) {
        clearTimeout(notificationToastTimerRef.current);
      }
      notificationToastTimerRef.current = setTimeout(() => {
        dispatch(clearLatestNotification());
      }, 4500);

      // 4. Trigger Native Desktop/Browser push notification if tab is in background
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        try {
          new Notification(`${firstName || "New Message"} - DevTinder`, {
            body: text,
            icon: "/favicon.ico",
          });
        } catch (e) {
          console.debug("Push notification error:", e);
        }
      }
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [userData?._id, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden relative">
      <NavBar />
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />

      {/* Global WhatsApp-Style In-App Floating Notification Banner */}
      {latestNotification && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-bounce-short transition-all duration-300 max-w-sm w-full px-2">
          <div
            onClick={() => {
              if (latestNotification.senderId) {
                navigate(`/chat?userId=${latestNotification.senderId}`);
              } else {
                navigate("/chat");
              }
              dispatch(clearLatestNotification());
            }}
            className="flex items-center gap-3 bg-base-100/95 backdrop-blur-md border border-success/40 text-base-content p-3.5 rounded-2xl shadow-2xl cursor-pointer hover:bg-base-200/95 transition-all border-l-4 border-l-success"
          >
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success text-xl shrink-0">
              💬
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-bold text-xs sm:text-sm text-base-content truncate">
                  {latestNotification.firstName}
                </p>
                <span className="text-[10px] text-base-content/50">{latestNotification.time}</span>
              </div>
              <p className="text-xs text-base-content/80 truncate mt-0.5">
                {latestNotification.text}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch(clearLatestNotification());
              }}
              className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Body;



