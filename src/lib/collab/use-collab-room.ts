"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from "y-protocols/awareness";
import { MonacoBinding } from "./monaco-binding";
import type { editor as MonacoEditorType } from "monaco-editor";
import { RoomStatus } from "../db/models/interview-room";

export type CollabConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "read_only"
  | "access_denied"
  | "error";

export type CollabSaveStatus = "saved" | "saving" | "error" | "idle";

export interface ActiveParticipantPresence {
  userId: string;
  name: string;
  email: string;
  role: "interviewer" | "candidate" | "observer";
  avatarUrl?: string;
  color: string;
  socketId: string;
  joinedAt: string;
}

export interface CollabRoomState {
  connectionStatus: CollabConnectionStatus;
  saveStatus: CollabSaveStatus;
  lastSavedAt: string | null;
  errorMessage: string | null;
  roomInfo: {
    roomCode: string;
    title: string;
    language: string;
    role: string;
    status: RoomStatus;
    isReadOnly: boolean;
  } | null;
  activeParticipants: ActiveParticipantPresence[];
  monacoBindingReady: boolean;
}

interface UseCollabRoomOptions {
  roomCode: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  serverUrl?: string;
}

interface ForceSaveAck {
  success?: boolean;
  error?: string;
  lastSavedAt?: string;
}

interface CollabJoinAck {
  success?: boolean;
  error?: string;
  room?: {
    roomCode: string;
    title: string;
    language: string;
    role: string;
    status: RoomStatus;
    isReadOnly: boolean;
    lastSavedAt?: string;
  };
  currentUserPresence?: ActiveParticipantPresence;
}

export function useCollabRoom({
  roomCode,
  currentUser,
  serverUrl = process.env.NEXT_PUBLIC_COLLAB_URL || "http://localhost:3001",
}: UseCollabRoomOptions) {
  const [state, setState] = useState<CollabRoomState>({
    connectionStatus: "connecting",
    saveStatus: "idle",
    lastSavedAt: null,
    errorMessage: null,
    roomInfo: null,
    activeParticipants: [],
    monacoBindingReady: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  // Update dynamic CSS for remote cursor flags & colors
  const updateCursorStyles = useCallback(
    (awareness: Awareness) => {
      if (typeof document === "undefined") return;

      let styleEl = styleElementRef.current;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = `pairzen-cursors-${roomCode}`;
        document.head.appendChild(styleEl);
        styleElementRef.current = styleEl;
      }

      const cssRules: string[] = [];
      const awarenessStates = awareness.getStates();

      awarenessStates.forEach((st, clientID) => {
        const user = st.user;
        if (user && user.color) {
          const color = user.color;
          const name = (user.name || "Anonymous").replace(/"/g, '\\"');

          cssRules.push(`
            .yRemoteSelection-${clientID} {
              background-color: ${color}2a !important;
            }
            .yRemoteSelectionHead-${clientID} {
              position: absolute !important;
              border-left: 2px solid ${color} !important;
              border-top: 2px solid ${color} !important;
              border-bottom: 2px solid ${color} !important;
              height: 100% !important;
              box-sizing: border-box !important;
            }
            .yRemoteSelectionHead-${clientID}::after {
              position: absolute !important;
              content: "${name}" !important;
              top: -18px !important;
              left: -2px !important;
              font-size: 10px !important;
              font-weight: 600 !important;
              line-height: 1 !important;
              padding: 2px 6px !important;
              border-radius: 3px !important;
              color: #ffffff !important;
              background-color: ${color} !important;
              white-space: nowrap !important;
              pointer-events: none !important;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4) !important;
              z-index: 50 !important;
            }
          `);
        }
      });

      styleEl.textContent = cssRules.join("\n");
    },
    [roomCode]
  );

  // Attach Monaco Editor when ready
  const bindMonacoEditor = useCallback(
    (editor: MonacoEditorType.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      if (!ydocRef.current || !awarenessRef.current) return;

      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      const model = editor.getModel();
      if (!model) return;

      const yText = ydocRef.current.getText("monaco");
      const binding = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        awarenessRef.current
      );

      bindingRef.current = binding;
      setState((prev) => ({ ...prev, monacoBindingReady: true }));
    },
    []
  );

  // Manual save trigger
  const forceSave = useCallback(() => {
    if (!socketRef.current) return;
    setState((prev) => ({ ...prev, saveStatus: "saving" }));
    socketRef.current.emit("collab:force_save", (res: ForceSaveAck) => {
      if (res?.success) {
        setState((prev) => ({
          ...prev,
          saveStatus: "saved",
          lastSavedAt: res.lastSavedAt || new Date().toISOString(),
        }));
      } else {
        setState((prev) => ({ ...prev, saveStatus: "error" }));
      }
    });
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    // 1. Initialize Yjs doc and awareness
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);
    ydocRef.current = ydoc;
    awarenessRef.current = awareness;

    // Pre-populate awareness user if available
    if (currentUser) {
      awareness.setLocalStateField("user", {
        name: currentUser.name,
        color: "#38bdf8",
        role: currentUser.role,
        avatarUrl: currentUser.avatarUrl,
      });
    }

    // 2. Connect to Socket.IO collaboration server
    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    socketRef.current = socket;

    // Outgoing local Yjs updates -> server
    const handleLocalYjsUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== "server" && origin !== "init_db") {
        socket.emit("collab:update", {
          roomCode,
          update: Buffer.from(update),
        });
      }
    };
    ydoc.on("update", handleLocalYjsUpdate);

    // Outgoing local awareness updates -> server
    const handleLocalAwareness = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      if (origin !== "remote") {
        const update = encodeAwarenessUpdate(awareness, added.concat(updated, removed));
        socket.emit("collab:awareness", {
          roomCode,
          update: Buffer.from(update),
        });
        updateCursorStyles(awareness);
      }
    };
    awareness.on("update", handleLocalAwareness);

    // Socket Connection Lifecycle Handlers
    socket.on("connect", () => {
      setState((prev) => ({
        ...prev,
        connectionStatus: "connecting",
        errorMessage: null,
      }));

      // Send join request
      socket.emit("collab:join", { roomCode }, (response: CollabJoinAck) => {
        if (!response?.success || !response.room) {
          console.error("[useCollabRoom] Join rejected:", response?.error);
          const isForbidden = response?.error?.includes("FORBIDDEN");
          setState((prev) => ({
            ...prev,
            connectionStatus: isForbidden ? "access_denied" : "error",
            errorMessage: response?.error || "Failed joining collaboration room",
          }));
          return;
        }

        const room = response.room;
        const myPresence = response.currentUserPresence;

        // Set local awareness identity
        if (myPresence) {
          awareness.setLocalStateField("user", {
            name: myPresence.name,
            color: myPresence.color,
            role: myPresence.role,
            avatarUrl: myPresence.avatarUrl,
          });
        }

        setState((prev) => ({
          ...prev,
          connectionStatus: room.isReadOnly ? "read_only" : "connected",
          roomInfo: room,
          lastSavedAt: room.lastSavedAt || null,
          saveStatus: room.lastSavedAt ? "saved" : "idle",
        }));
      });
    });

    let hasLoggedDisconnect = false;
    socket.on("connect_error", (err) => {
      if (!hasLoggedDisconnect) {
        console.warn("[useCollabRoom] Collaboration service unavailable, attempting to reconnect:", err.message);
        hasLoggedDisconnect = true;
      }
      const isAuthErr = err.message.includes("UNAUTHENTICATED") || err.message.includes("UNAUTHORIZED");
      setState((prev) => ({
        ...prev,
        connectionStatus: isAuthErr ? "access_denied" : "offline",
        errorMessage: isAuthErr
          ? "You must be authenticated and authorized to access this room."
          : "Collaboration server offline. Trying to reconnect...",
      }));
    });

    socket.on("connect", () => {
      hasLoggedDisconnect = false;
    });

    socket.on("reconnect_attempt", () => {
      setState((prev) => ({ ...prev, connectionStatus: "reconnecting" }));
    });

    socket.on("disconnect", (reason) => {
      setState((prev) => ({
        ...prev,
        connectionStatus: reason === "io client disconnect" ? "offline" : "reconnecting",
      }));
    });

    // Incoming full initial state
    socket.on("collab:sync_full", (data: { roomCode: string; update: ArrayBuffer | Uint8Array }) => {
      try {
        if (data.update) {
          Y.applyUpdate(ydoc, new Uint8Array(data.update), "server");
        }
      } catch (e) {
        console.error("[useCollabRoom] Error applying sync_full:", e);
      }
    });

    // Incoming peer updates
    socket.on("collab:update", (data: { roomCode: string; update: ArrayBuffer | Uint8Array }) => {
      try {
        if (data.update) {
          Y.applyUpdate(ydoc, new Uint8Array(data.update), "server");
        }
      } catch (e) {
        console.error("[useCollabRoom] Error applying incoming update:", e);
      }
    });

    // Incoming peer awareness updates
    socket.on("collab:awareness", (data: { roomCode: string; update: ArrayBuffer | Uint8Array }) => {
      try {
        if (data.update) {
          applyAwarenessUpdate(awareness, new Uint8Array(data.update), "remote");
          updateCursorStyles(awareness);
        }
      } catch (e) {
        console.error("[useCollabRoom] Error applying awareness update:", e);
      }
    });

    // Incoming presence list
    socket.on("collab:presence_list", (data: { roomCode: string; participants: ActiveParticipantPresence[] }) => {
      setState((prev) => ({
        ...prev,
        activeParticipants: data.participants || [],
      }));
      updateCursorStyles(awareness);
    });

    // Incoming save status
    socket.on("collab:save_status", (data: { status: CollabSaveStatus; lastSavedAt?: string }) => {
      setState((prev) => ({
        ...prev,
        saveStatus: data.status,
        lastSavedAt: data.lastSavedAt || prev.lastSavedAt,
      }));
    });

    // Incoming error from server
    socket.on("collab:error", (data: { message: string }) => {
      console.warn("[useCollabRoom] Collab server event error:", data.message);
      if (data.message === "ROOM_IS_READ_ONLY") {
        setState((prev) => ({ ...prev, connectionStatus: "read_only" }));
      }
    });

    // Teardown on unmount
    return () => {
      ydoc.off("update", handleLocalYjsUpdate);
      awareness.off("update", handleLocalAwareness);

      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      awareness.destroy();
      ydoc.destroy();

      socket.removeAllListeners();
      socket.disconnect();

      if (styleElementRef.current && styleElementRef.current.parentNode) {
        styleElementRef.current.parentNode.removeChild(styleElementRef.current);
        styleElementRef.current = null;
      }
    };
  }, [roomCode, serverUrl, currentUser, updateCursorStyles]);

  return {
    ...state,
    bindMonacoEditor,
    forceSave,
  };
}
