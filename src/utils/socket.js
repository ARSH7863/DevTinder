import io from 'socket.io-client';
import { BASE_URL } from './constants';

let socket = null;

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// On localhost -> http://localhost:7777, in production -> DuckDNS HTTPS URL
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (isLocalhost
    ? "http://localhost:7777"
    : "https://arsh-devtinder.duckdns.org");

export const createSocketConnection = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: "/socket.io/",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Play pleasant WhatsApp-style incoming message chime using Web Audio API
export const playIncomingMessageSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Two-tone chime (WhatsApp style: 880Hz then 1320Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(880, now); // A5 note
    osc2.frequency.setValueAtTime(1320, now + 0.08); // E6 note

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.09);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.debug("Audio notification could not be played:", e);
  }
};