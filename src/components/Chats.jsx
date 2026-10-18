import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL, DEFAULT_USER_AVATAR, getCleanAvatar } from "../utils/constants";
import { addConnections } from "../utils/connectionSlice";
import { createSocketConnection, playIncomingMessageSound } from "../utils/socket";
import { resetUnreadCount } from "../utils/chatNotificationSlice";
import UserDetailsModal from "./UserDetailsModal";

export const formatLastSeenIST = (dateString) => {
  if (!dateString) return "Offline";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Offline";
  const now = new Date();

  // Format options for IST (Asia/Kolkata)
  const timeStr = date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Check if date was today in IST
  const dateIST = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  const todayIST = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  if (dateIST === todayIST) {
    return `Last seen today at ${timeStr}`;
  }

  const dateFormatted = date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  });
  return `Last seen ${dateFormatted} at ${timeStr}`;
};

const EMOJIS = ["👍", "❤️", "😂", "🔥", "🚀", "💻", "🎉", "💯", "👏", "🤝", "⚡", "✨", "☕", "🥑", "🤩", "🙌"];

const Chats = () => {
  const loggedInUser = useSelector((store) => store.user);
  const connections = useSelector((store) => store.connections);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const { targetUserId } = useParams();
  const queryUserId = searchParams.get("userId") || targetUserId;

  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [searchContactQuery, setSearchContactQuery] = useState("");
  const [callModal, setCallModal] = useState(null);
  const [loadingConnections, setLoadingConnections] = useState(!connections);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingSentRef = useRef(false);
  const notificationToastTimerRef = useRef(null);

  // Request browser Notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Fetch real connections from backend
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoadingConnections(true);
        const res = await axios.get(`${BASE_URL}/user/connections`, {
          withCredentials: true,
        });
        const data = res?.data?.data || res?.data || [];
        if (Array.isArray(data)) {
          dispatch(addConnections(data));
          const formatted = data.map((u) => ({
            ...u,
            _id: u._id,
            firstName: u.firstName || "Developer",
            lastName: u.lastName || "",
            photoUrl: getCleanAvatar(u.photoUrl || u.photoURL),
            about: u.about || u.skills?.slice(0, 3).join(", ") || "",
            membershipType: u.membershipType,
            isOnline: !!u.isOnline,
            lastSeen: u.lastSeen || "",
            unreadCount: 0,
            lastMessage: "",
            lastMessageTime: "",
          }));
          setContacts(formatted);

          if (queryUserId) {
            const found = formatted.find((c) => c._id === queryUserId);
            if (found) {
              setActiveContactId(found._id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch connections for chat:", err);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, [dispatch, queryUserId]);

  // Keep activeContactId in sync only on initial load or URL change
  useEffect(() => {
    if (queryUserId && contacts.length > 0 && !activeContactId) {
      const match = contacts.find((c) => String(c._id) === String(queryUserId));
      if (match) {
        setActiveContactId(match._id);
      }
    }
  }, [queryUserId, contacts.length]);

  // Fetch chat history from DB whenever active contact changes
  useEffect(() => {
    if (!activeContactId) return;

    const fetchChatMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await axios.get(`${BASE_URL}/chat/${activeContactId}`, {
          withCredentials: true,
        });

        const rawMessages = res.data?.messages || res.data?.data?.messages || [];
        const currentUserId = loggedInUser?._id;

        const formatted = rawMessages.map((msg) => {
          const senderId =
            typeof msg.senderId === "object" && msg.senderId !== null
              ? msg.senderId._id
              : msg.senderId;

          const firstName =
            typeof msg.senderId === "object" && msg.senderId !== null
              ? msg.senderId.firstName
              : msg.firstName || "Developer";

          const timeStr = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";

          return {
            id: msg._id || "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
            sender: String(senderId) === String(currentUserId) ? "me" : "them",
            senderId,
            firstName,
            text: msg.text,
            time: timeStr,
            // Messages loaded from DB history are already read by both sides
            status: String(senderId) === String(currentUserId) ? "read" : "read",
          };
        });

        setMessages(formatted);

        // Also update last message preview in contacts list if messages exist
        if (formatted.length > 0) {
          const lastMsg = formatted[formatted.length - 1];
          setContacts((prev) =>
            prev.map((c) =>
              c._id === activeContactId
                ? { ...c, lastMessage: lastMsg.text, lastMessageTime: lastMsg.time }
                : c
            )
          );
        }
      } catch (err) {
        console.error("Failed to fetch chat messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchChatMessages();
  }, [activeContactId, loggedInUser?._id]);

  // Ref to always have the latest activeContactId in stable listeners
  const activeContactIdRef = useRef(activeContactId);
  useEffect(() => {
    activeContactIdRef.current = activeContactId;
  }, [activeContactId]);

  // ─── STABLE SOCKET LIFECYCLE ───────────────────────────────────────────────
  // Runs ONCE per user login. Registers all event listeners on the singleton
  // socket and never tears them down on contact switch — preventing missed msgs.
  useEffect(() => {
    console.log("Current user for chat socket:", loggedInUser);
    const currentUserId = loggedInUser?._id;
    if (!currentUserId) return;

    const socket = createSocketConnection();
    socketRef.current = socket;

    // Join personal notification room (re-join on reconnect via "connect" event)
    const joinPersonalRoom = () => {
      socket.emit("joinUser", { userId: currentUserId });
      // Also re-join active chat room if any (handles server restarts)
      if (activeContactIdRef.current) {
        socket.emit("joinChat", {
          firstName: loggedInUser?.firstName || "Developer",
          userId: currentUserId,
          targetUserId: activeContactIdRef.current,
        });
      }
    };

    if (socket.connected) {
      joinPersonalRoom();
    } else {
      socket.on("connect", joinPersonalRoom);
    }

    // ── messageReceived ────────────────────────────────────────────────────
    const handleIncomingMessage = ({ _id, tempId, firstName, text, senderId, targetUserId, createdAt, status }) => {
      const timeStr = createdAt
        ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const isMe = String(senderId) === String(currentUserId);
      const isForActiveChat =
        isMe ||
        (activeContactIdRef.current && String(senderId) === String(activeContactIdRef.current));

      if (isForActiveChat) {
        setMessages((prev) => {
          // Prevent duplicates by message ID
          if (_id && prev.some((m) => m.id === _id)) {
            return prev;
          }
          // If it's our own message, check if we have a matching optimistic message to update
          if (isMe) {
            const index = prev.findIndex(
              (m) =>
                (tempId && m.id === tempId) ||
                (m.sender === "me" && m.text === text && (m.status === "sent" || m.status === "delivered"))
            );
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                id: _id || updated[index].id,
                status: status || updated[index].status,
              };
              return updated;
            }
          }

          // Also guard if message already exists with same sender and text at the same time
          if (prev.some((m) => m.senderId === senderId && m.text === text && m.time === timeStr)) {
            return prev;
          }

          const incomingMsg = {
            id: _id || "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
            sender: isMe ? "me" : "them",
            senderId,
            firstName,
            text,
            time: timeStr,
            status: isMe ? (status || "sent") : "read",
          };
          return [...prev, incomingMsg];
        });
      }

      // Clear typing indicator when sender's message arrives
      if (String(senderId) === String(activeContactIdRef.current)) {
        setIsTyping(false);
      }

      // Mark read if recipient is actively chatting
      if (!isMe) {
        const isCurrentlyChatting = String(senderId) === String(activeContactIdRef.current);

        // Tell the sender their message has been read (recipient is actively viewing this chat)
        if (isCurrentlyChatting && socketRef.current?.connected) {
          socketRef.current.emit("markRead", {
            readerId: currentUserId,
            senderId,
          });
        }
      }

      // Update sidebar last message preview & unread count
      const contactToUpdate = isMe ? activeContactIdRef.current : senderId;
      setContacts((prev) => {
        const updated = prev.map((c) => {
          if (String(c._id) === String(senderId)) {
            return {
              ...c,
              lastMessage: text,
              lastMessageTime: timeStr,
              unreadCount:
                String(activeContactIdRef.current) === String(senderId)
                  ? 0
                  : (c.unreadCount || 0) + 1,
            };
          }
          if (
            String(senderId) === String(currentUserId) &&
            String(c._id) === String(activeContactIdRef.current)
          ) {
            return { ...c, lastMessage: text, lastMessageTime: timeStr };
          }
          return c;
        });
        // Bubble the relevant contact to the top
        if (contactToUpdate) {
          const idx = updated.findIndex((c) => String(c._id) === String(contactToUpdate));
          if (idx > 0) {
            const [item] = updated.splice(idx, 1);
            return [item, ...updated];
          }
        }
        return updated;
      });
    };

    // ── newNotification (for messages in OTHER conversations) ──────────────
    const handleNewNotification = ({ senderId, text, createdAt }) => {
      // ⛔ Never update or notify for messages sent by ourselves!
      if (String(senderId) === String(currentUserId)) return;
      if (String(activeContactIdRef.current) === String(senderId)) return;
      const timeStr = createdAt
        ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setContacts((prev) =>
        prev.map((c) =>
          String(c._id) === String(senderId)
            ? { ...c, lastMessage: text, lastMessageTime: timeStr, unreadCount: (c.unreadCount || 0) + 1 }
            : c
        )
      );
    };

    // ── messageSent ack from backend with real delivery status ──────────────
    const handleMessageSent = ({ tempId, msgId, status }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: msgId || m.id, status: status || (m.status === "read" ? "read" : "sent") }
            : m
        )
      );
    };

    // ── messagesDelivered: recipient just logged in → flip all 'sent' msgs to 'delivered' ──
    const handleMessagesDelivered = ({ recipientId }) => {
      if (String(recipientId) === String(activeContactIdRef.current)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === "me" && m.status === "sent" ? { ...m, status: "delivered" } : m
          )
        );
      }
    };

    // ── userOnline / userOffline presence events ───────────────────────────
    const handleUserOnline = ({ userId }) => {
      if (!userId) return;
      setContacts((prev) =>
        prev.map((c) => (String(c._id) === String(userId) ? { ...c, isOnline: true } : c))
      );
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      if (!userId) return;
      setContacts((prev) =>
        prev.map((c) =>
          String(c._id) === String(userId)
            ? { ...c, isOnline: false, lastSeen: lastSeen || c.lastSeen || null }
            : c
        )
      );
    };

    // ── messagesRead: recipient opened the chat → flip all my msgs to 'read' ──────
    const handleMessagesRead = ({ readerId }) => {
      // readerId is the OTHER person who just read our messages
      if (String(readerId) === String(activeContactIdRef.current)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === "me" && m.status !== "read" ? { ...m, status: "read" } : m
          )
        );
      }
    };

    // ── typing ────────────────────────────────────────────────────────────
    const handleUserTyping = (data) => {
      if (String(data?.userId) === String(activeContactIdRef.current)) setIsTyping(true);
    };

    const handleUserStopTyping = (data) => {
      if (String(data?.userId) === String(activeContactIdRef.current)) setIsTyping(false);
    };

    // ── chatCleared: other user or backend cleared the conversation ─────────
    const handleChatCleared = ({ targetUserId, userId }) => {
      if (
        String(activeContactIdRef.current) === String(targetUserId) ||
        String(activeContactIdRef.current) === String(userId)
      ) {
        setMessages([]);
      }
      const contactIdToClear =
        String(userId) === String(currentUserId) ? targetUserId : userId;
      if (contactIdToClear) {
        setContacts((prev) =>
          prev.map((c) =>
            String(c._id) === String(contactIdToClear)
              ? { ...c, lastMessage: "", lastMessageTime: "" }
              : c
          )
        );
      }
    };

    socket.on("messageReceived", handleIncomingMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("messagesDelivered", handleMessagesDelivered);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("newNotification", handleNewNotification);
    socket.on("typing", handleUserTyping);
    socket.on("stopTyping", handleUserStopTyping);
    socket.on("chatCleared", handleChatCleared);

    return () => {
      socket.off("connect", joinPersonalRoom);
      socket.off("messageReceived", handleIncomingMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("messagesDelivered", handleMessagesDelivered);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("newNotification", handleNewNotification);
      socket.off("typing", handleUserTyping);
      socket.off("stopTyping", handleUserStopTyping);
      socket.off("chatCleared", handleChatCleared);
    };
  }, [loggedInUser?._id]); // ← stable: only re-runs if user changes

  // ─── JOIN CHAT ROOM when active contact changes ────────────────────────────
  // Lightweight: just emits joinChat. Listeners above stay stable.
  useEffect(() => {
    if (!activeContactId || !loggedInUser?._id) return;
    const socket = socketRef.current;
    if (!socket) return;

    const doJoin = () => {
      socket.emit("joinChat", {
        firstName: loggedInUser?.firstName || "Developer",
        userId: loggedInUser._id,
        targetUserId: activeContactId,
      });
      console.log("✅ joinChat emitted for:", activeContactId);

      // Also tell the active contact we have read/opened their messages
      socket.emit("markRead", {
        readerId: loggedInUser._id,
        senderId: activeContactId,
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", doJoin);
    }

    return () => {
      socket.emit("leaveChat", {
        userId: loggedInUser._id,
        targetUserId: activeContactId,
      });
      console.log("👋 leaveChat emitted for:", activeContactId);
    };
  }, [activeContactId, loggedInUser?._id]);

  // Scroll to bottom on message update or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const activeContact = contacts.find((c) => c._id === activeContactId) || null;

  // ─── Bubble the contact with this id to index 0 ──────────────────────────
  const bringToTop = (contactId) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => String(c._id) === String(contactId));
      if (idx <= 0) return prev; // already on top or not found
      const updated = [...prev];
      const [item] = updated.splice(idx, 1);
      return [item, ...updated];
    });
  };

  const handleSelectContact = (id) => {
    // Clear any pending typing timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingSentRef.current && socketRef.current && loggedInUser?._id && activeContactId) {
      socketRef.current.emit("stopTyping", {
        userId: loggedInUser._id,
        targetUserId: activeContactId,
      });
      isTypingSentRef.current = false;
    }

    setActiveContactId(id);
    navigate(`/chat?userId=${id}`, { replace: true });
    setIsTyping(false);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
    setMessages([]);

    // Clear unread badge for the newly selected contact
    setContacts((prev) =>
      prev.map((c) => (String(c._id) === String(id) ? { ...c, unreadCount: 0 } : c))
    );

    // Also reset global navbar unread badge
    dispatch(resetUnreadCount());
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);

    const currentUserId = loggedInUser?._id;
    if (!socketRef.current || !activeContact || !currentUserId) return;

    if (value.trim()) {
      // Emit typing event if not already emitted
      if (!isTypingSentRef.current) {
        socketRef.current.emit("typing", {
          firstName: loggedInUser?.firstName || "Developer",
          userId: currentUserId,
          targetUserId: activeContact._id,
        });
        isTypingSentRef.current = true;
      }

      // Reset debounce timer to stop typing after 2 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit("stopTyping", {
            userId: currentUserId,
            targetUserId: activeContact._id,
          });
        }
        isTypingSentRef.current = false;
      }, 2000);
    } else {
      // Input was cleared
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingSentRef.current) {
        socketRef.current.emit("stopTyping", {
          userId: currentUserId,
          targetUserId: activeContact._id,
        });
        isTypingSentRef.current = false;
      }
    }
  };

  const handleSendMessage = (customText = null) => {
    const textToSend = (customText || inputText).trim();
    const currentUserId = loggedInUser?._id;
    if (!textToSend || !activeContact || !currentUserId) return;

    // Clear typing indicator immediately on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingSentRef.current && socketRef.current) {
      socketRef.current.emit("stopTyping", {
        userId: currentUserId,
        targetUserId: activeContact._id,
      });
      isTypingSentRef.current = false;
    }

    // Build optimistic message with 'sent' status (single grey tick)
    const tempId = "temp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const optimisticMsg = {
      id: tempId,
      sender: "me",
      senderId: currentUserId,
      firstName: loggedInUser?.firstName || "Developer",
      text: textToSend,
      time: timeStr,
      status: "sent", // ← single grey tick until backend acks
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Update sidebar preview + bring active contact to top immediately on send
    setContacts((prev) => {
      const updated = prev.map((c) =>
        String(c._id) === String(activeContact._id)
          ? { ...c, lastMessage: textToSend, lastMessageTime: timeStr }
          : c
      );
      const idx = updated.findIndex((c) => String(c._id) === String(activeContact._id));
      if (idx > 0) {
        const [item] = updated.splice(idx, 1);
        return [item, ...updated];
      }
      return updated;
    });

    // Emit message to backend socket (include tempId so backend can ack it)
    if (socketRef.current) {
      socketRef.current.emit("sendMessage", {
        firstName: loggedInUser?.firstName || "Developer",
        userId: currentUserId,
        targetUserId: activeContact._id,
        text: textToSend,
        tempId, // backend echoes this back in 'messageSent' ack
      });
    }

    setInputText("");
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
  };

  const handleClearChat = async () => {
    setMessages([]);
    if (activeContactId) {
      setContacts((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeContactId)
            ? { ...c, lastMessage: "", lastMessageTime: "" }
            : c
        )
      );

      // Emit clearChat via socket for real-time clearance
      if (socketRef.current?.connected && loggedInUser?._id) {
        socketRef.current.emit("clearChat", {
          userId: loggedInUser._id,
          targetUserId: activeContactId,
        });
      }

      // Also persist clear via REST DELETE request
      try {
        await axios.delete(`${BASE_URL}/chat/${activeContactId}`, {
          withCredentials: true,
        });
      } catch (e) {
        console.error("Failed to delete chat via REST:", e);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      fullName.includes(searchContactQuery.toLowerCase()) ||
      c.about?.toLowerCase().includes(searchContactQuery.toLowerCase())
    );
  });

  return (
    <div className="w-full h-[calc(100vh-68px)] max-w-7xl mx-auto p-2 sm:p-4 flex flex-col box-border">
      {/* Main Container Window */}
      <div className="flex-1 w-full bg-base-100 rounded-2xl shadow-2xl border border-base-300 flex overflow-hidden relative">
        {/* ========================================================= */}
        {/* LEFT COLUMN: CONTACTS / CHAT LIST (WhatsApp Sidebar)     */}
        {/* ========================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-col border-r border-base-300 bg-base-200/50 backdrop-blur-sm ${
            activeContactId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Sidebar Top Header */}
          <div className="p-3.5 bg-base-200 border-b border-base-300 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-10 h-10 rounded-full ring ring-primary/30">
                  <img
                    src={getCleanAvatar(loggedInUser?.photoUrl || loggedInUser?.photoURL)}
                    alt="My avatar"
                  />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-base text-base-content leading-tight">Chats</h2>
                <span className="text-[11px] text-base-content/60 font-medium flex items-center gap-1">
                  {contacts.length} {contacts.length === 1 ? "Connection" : "Connections"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-base-content/70">
              <button
                className="btn btn-ghost btn-sm btn-circle"
                title="Find Connections"
                onClick={() => navigate("/connections")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-2.5 bg-base-200/80 border-b border-base-300">
            <div className="relative">
              <input
                type="text"
                placeholder="Search connections..."
                value={searchContactQuery}
                onChange={(e) => setSearchContactQuery(e.target.value)}
                className="input input-sm w-full pl-9 bg-base-100 border-base-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 absolute left-3 top-2.5 text-base-content/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-base-300/60">
            {loadingConnections ? (
              <div className="p-8 text-center text-base-content/60 text-xs">
                <span className="loading loading-spinner loading-sm text-primary mb-2"></span>
                <p>Loading connections...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-base-content/60 text-xs flex flex-col items-center">
                <span className="text-3xl mb-2">👥</span>
                <p className="font-semibold mb-1">No connections yet</p>
                <p className="text-[11px] text-base-content/50 mb-4">Connect with developers on the feed to start chatting.</p>
                <button
                  onClick={() => navigate("/")}
                  className="btn btn-primary btn-xs rounded-full"
                >
                  Explore Feed
                </button>
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isActive = c._id === activeContactId;

                return (
                  <div
                    key={c._id}
                    onClick={() => handleSelectContact(c._id)}
                    className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors relative ${
                      isActive
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-base-300/40"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="avatar shrink-0 relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img
                          src={c.photoUrl}
                          alt={c.firstName}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_USER_AVATAR;
                          }}
                        />
                      </div>
                      {c.isOnline && (
                        <span className="w-3.5 h-3.5 bg-success rounded-full border-2 border-base-100 absolute bottom-0 right-0"></span>
                      )}
                    </div>

                    {/* Contact Info & Last Message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-sm truncate text-base-content">
                            {c.firstName} {c.lastName}
                          </span>
                          {c.membershipType?.toLowerCase() === "gold" && (
                            <span title="Gold VIP Member" className="text-xs">
                              👑
                            </span>
                          )}
                          {c.membershipType?.toLowerCase() === "silver" && (
                            <span title="Silver Pro Member" className="text-xs">
                              🛡️
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-base-content/50 shrink-0">
                          {c.lastMessageTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs text-base-content/70 truncate">
                          {c.lastMessage !== undefined && c.lastMessage !== ""
                            ? c.lastMessage
                            : c.about || "Click to start chatting"}
                        </div>
                        {c.unreadCount > 0 && (
                          <span className="badge badge-success badge-xs font-bold text-[10px] shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ACTIVE CHAT CONVERSATION (WhatsApp View)     */}
        {/* ========================================================= */}
        <div
          className={`flex-1 flex-col h-full relative ${
            activeContactId ? "flex" : "hidden md:flex"
          }`}
        >
          {activeContact ? (
            <>
              {/* WhatsApp Chat Header */}
              <div className="px-4 py-2.5 bg-base-200/95 border-b border-base-300 flex items-center justify-between z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setActiveContactId(null)}
                    className="btn btn-ghost btn-xs btn-circle md:hidden"
                    title="Back to chats"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Header Avatar & Name (Clickable to view profile) */}
                  <div
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
                    title="View Profile"
                  >
                    <div className="avatar shrink-0 relative">
                      <div className="w-10 h-10 rounded-full">
                        <img
                          src={activeContact.photoUrl}
                          alt={activeContact.firstName}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_USER_AVATAR;
                          }}
                        />
                      </div>
                      {activeContact.isOnline && (
                        <span className="w-2.5 h-2.5 bg-success rounded-full border-2 border-base-100 absolute bottom-0 right-0"></span>
                      )}
                    </div>

                    {/* Name and Status */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
                          {activeContact.firstName} {activeContact.lastName}
                        </h3>
                        {activeContact.membershipType?.toLowerCase() === "gold" && (
                          <span title="Gold VIP Member" className="text-xs">
                            👑
                          </span>
                        )}
                        {activeContact.membershipType?.toLowerCase() === "silver" && (
                          <span title="Silver Pro Member" className="text-xs">
                            🛡️
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] leading-none mt-0.5">
                        {isTyping ? (
                          <span className="text-success font-semibold flex items-center gap-1 animate-pulse">
                            <span>typing</span>
                            <span className="inline-flex gap-0.5">
                              <span className="w-1 h-1 bg-success rounded-full animate-bounce"></span>
                              <span className="w-1 h-1 bg-success rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1 h-1 bg-success rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </span>
                          </span>
                        ) : activeContact.isOnline ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                            Online
                          </span>
                        ) : (
                          <span className="text-base-content/60 font-medium">
                            {formatLastSeenIST(activeContact.lastSeen)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons (TODO: Add Video Call and Voice Call features later) */}
                <div className="flex items-center gap-1 text-base-content/70">
                  <div className="dropdown dropdown-end">
                    <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle" title="More options">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-30 menu p-2 shadow-2xl !bg-base-100 text-base-content rounded-box w-48 text-xs border border-base-300 opacity-100"
                    >
                      <li>
                        <a onClick={() => setShowProfileModal(true)} className="hover:bg-base-200">View Profile</a>
                      </li>
                      <li>
                        <a onClick={handleClearChat} className="text-error hover:bg-error/10">Clear Chat</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* =================================================== */}
              {/* WHATSAPP CHAT BACKGROUND & MESSAGE STREAM           */}
              {/* =================================================== */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3 relative"
                style={{
                  backgroundImage: `radial-gradient(circle at 10px 10px, rgba(100, 116, 139, 0.08) 2px, transparent 0)`,
                  backgroundSize: "28px 28px",
                }}
              >
                {/* End-to-End Encryption Banner */}
                <div className="flex justify-center my-2">
                  <div className="bg-base-200/90 border border-base-300/80 text-base-content/70 text-[11px] px-3.5 py-1.5 rounded-xl shadow-xs max-w-md text-center flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>Messages are end-to-end encrypted. Nobody outside this chat can read them.</span>
                  </div>
                </div>

                {/* Loading indicator while fetching chat history */}
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-base-content/50">
                    <span className="loading loading-spinner loading-md text-primary mb-2"></span>
                    <p className="text-xs">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  /* Blank State if no messages yet */
                  <div className="flex flex-col items-center justify-center py-12 text-center text-base-content/50">
                    <span className="text-4xl mb-2">👋</span>
                    <p className="text-sm font-semibold">No messages yet</p>
                    <p className="text-xs">Send a message to start the conversation with {activeContact.firstName}.</p>
                  </div>
                ) : null}

                {/* Messages List */}
                {messages.map((msg) => {
                  const isMe = msg.sender === "me";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-1.5 group`}
                    >
                      {!isMe && (
                        <div className="avatar shrink-0 mb-1 hidden sm:block">
                          <div className="w-6 h-6 rounded-full">
                            <img src={activeContact.photoUrl} alt="Avatar" />
                          </div>
                        </div>
                      )}

                      {/* Chat Bubble */}
                      <div
                        className={`relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl shadow-sm text-sm break-words ${
                          isMe
                            ? "bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef] rounded-tr-none"
                            : "bg-base-100 text-base-content border border-base-300/70 rounded-tl-none"
                        }`}
                      >
                        <div className="leading-relaxed pr-14 select-text">{msg.text}</div>

                        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] opacity-70 select-none">
                          <span>{msg.time}</span>
                          {isMe && (
                            <span
                              className={`text-[12px] font-bold leading-none ${
                                msg.status === "read"
                                  ? "text-[#53bdeb]"        // blue  ✓✓ = seen
                                  : "text-base-content/40"  // grey  ✓ or ✓✓
                              }`}
                              title={
                                msg.status === "read"
                                  ? "Seen"
                                  : msg.status === "delivered"
                                  ? "Delivered"
                                  : "Sent"
                              }
                            >
                              {msg.status === "sent" ? "✓" : "✓✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start items-end gap-1.5 animate-fadeIn">
                    <div className="avatar shrink-0 mb-1 hidden sm:block">
                      <div className="w-6 h-6 rounded-full">
                        <img src={activeContact.photoUrl} alt="Avatar" />
                      </div>
                    </div>
                    <div className="bg-base-100 border border-base-300/80 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-success/80 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-success/80 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-success/80 animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-xs text-base-content/50 ml-1.5 italic">
                        {activeContact.firstName} is typing...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Tray */}
              {showEmojiPicker && (
                <div className="bg-base-200 border-t border-base-300 p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shadow-inner max-w-full no-scrollbar">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setInputText((prev) => prev + emoji)}
                      className="btn btn-ghost btn-xs sm:btn-sm text-base sm:text-lg hover:scale-125 transition-transform shrink-0 p-1 min-h-0 h-8 w-8"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Attachment Menu */}
              {showAttachmentMenu && (
                <div className="bg-base-200 border-t border-base-300 p-3 grid grid-cols-4 gap-2 text-center text-xs animate-fadeIn max-w-full">
                  <button
                    onClick={() => {
                      handleSendMessage("📷 [Photo / Media]");
                      setShowAttachmentMenu(false);
                    }}
                    className="p-2 hover:bg-base-300 rounded-xl flex flex-col items-center gap-1"
                  >
                    <span className="text-2xl">🖼️</span>
                    <span>Media</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSendMessage("📄 [Document]");
                      setShowAttachmentMenu(false);
                    }}
                    className="p-2 hover:bg-base-300 rounded-xl flex flex-col items-center gap-1"
                  >
                    <span className="text-2xl">📄</span>
                    <span>Document</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSendMessage("💻 [Code snippet]");
                      setShowAttachmentMenu(false);
                    }}
                    className="p-2 hover:bg-base-300 rounded-xl flex flex-col items-center gap-1"
                  >
                    <span className="text-2xl">👨‍💻</span>
                    <span>Code</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSendMessage("🔗 [Link]");
                      setShowAttachmentMenu(false);
                    }}
                    className="p-2 hover:bg-base-300 rounded-xl flex flex-col items-center gap-1"
                  >
                    <span className="text-2xl">🔗</span>
                    <span>Link</span>
                  </button>
                </div>
              )}

              {/* Bottom Input Bar */}
              <div className="p-2 sm:p-3 bg-base-200/90 border-t border-base-300 flex items-center gap-1.5 sm:gap-2 max-w-full box-border">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`btn btn-ghost btn-circle btn-sm shrink-0 ${
                    showEmojiPicker ? "text-primary" : "text-base-content/70"
                  }`}
                  title="Emoji"
                >
                  <span className="text-base sm:text-lg">😊</span>
                </button>

                {/* TODO: Add File / Media Attachment feature later */}

                <div className="flex-1 min-w-0 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="input input-sm sm:input-md w-full bg-base-100 border-base-300 rounded-full px-3.5 sm:px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-success/50 shadow-inner"
                  />
                </div>

                {/* Send Button (TODO: Add Microphone / Voice Note feature later) */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className={`btn btn-circle btn-sm sm:btn-md border-none shadow-md transition-transform active:scale-95 shrink-0 ${
                    inputText.trim()
                      ? "bg-[#00a884] hover:bg-[#008f6f] text-white"
                      : "bg-base-300 text-base-content/30 cursor-not-allowed"
                  }`}
                  title="Send message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            /* No Contact Selected State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-base-200/40">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl mb-4 text-primary">
                💬
              </div>
              <h3 className="font-bold text-xl mb-1">DevTinder Web Chat</h3>
              <p className="text-xs sm:text-sm text-base-content/60 max-w-sm mb-6">
                Select a connection from the left sidebar to open the chat window.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Call Modal */}
      {callModal && activeContact && (
        <dialog className="modal modal-open">
          <div className="modal-box text-center max-w-sm bg-base-200 border border-base-300 rounded-3xl p-6 shadow-2xl">
            <div className="avatar mb-4 relative inline-block">
              <div className="w-24 h-24 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-4 animate-pulse">
                <img src={activeContact.photoUrl} alt="Avatar" />
              </div>
            </div>
            <h3 className="text-xl font-bold">
              {activeContact.firstName} {activeContact.lastName}
            </h3>
            <p className="text-xs text-success font-medium mt-1 animate-pulse">
              {callModal === "video" ? "Video Calling..." : "Voice Calling..."}
            </p>

            <div className="flex items-center justify-center gap-6 mt-8">
              <button
                onClick={() => setCallModal(null)}
                className="btn btn-circle btn-error text-white shadow-lg w-14 h-14"
                title="End Call"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.28 3H5z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setCallModal(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* Profile Details Modal for Selected Person */}
      {showProfileModal && activeContact && (
        <UserDetailsModal
          user={activeContact}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

    </div>
  );
};

export default Chats;
