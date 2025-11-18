import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/AuthStore";

export interface TerminalMessage {
  type: "input" | "output" | "resize" | "error" | "close" | "metadata";
  data: string;
  rows?: number;
  cols?: number;
}

export interface TerminalMetadata {
  pod: string;
  container: string;
  namespace: string;
  cluster: string;
}

export interface UseTerminalResult {
  isConnected: boolean;
  error: string | null;
  metadata: TerminalMetadata | null;
  sendInput: (data: string) => void;
  sendResize: (rows: number, cols: number) => void;
  reconnect: () => void;
  disconnect: () => void;
}

const RECONNECT_DELAY_MS = 3000;

// Global connection tracker to prevent duplicate connections
const activeConnections = new Set<string>();

export function useTerminal(
  resourceId: string,
  container?: string,
  shell: string = "/bin/sh",
  enabled: boolean = true,
  onOutput?: (data: string) => void,
  onClose?: (message: string) => void
): UseTerminalResult {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TerminalMetadata | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const hasInitialized = useRef(false);
  const connectionKeyRef = useRef<string | null>(null);
  const shouldReconnectRef = useRef<boolean>(true);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      // Only close if the WebSocket is OPEN or CLOSING
      // Don't close if it's still CONNECTING (readyState === 0)
      // This prevents React StrictMode from closing connections before they're established
      if (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CLOSING) {
        console.log("[useTerminal] Closing WebSocket, readyState:", wsRef.current.readyState);
        wsRef.current.close();
      } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
        console.log("[useTerminal] WebSocket still connecting, not closing immediately");
        // Mark for cleanup once connected
        const ws = wsRef.current;
        ws.addEventListener('open', () => {
          console.log("[useTerminal] Closing WebSocket after connect (StrictMode cleanup)");
          ws.close();
        });
      }
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);

    // Remove from global tracker
    if (connectionKeyRef.current) {
      const keyToDelete = connectionKeyRef.current;
      setTimeout(() => {
        activeConnections.delete(keyToDelete);
      }, 100);
      connectionKeyRef.current = null;
    }
  }, []);

  const sendInput = useCallback((data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const msg: TerminalMessage = {
        type: "input",
        data,
      };
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const sendResize = useCallback((rows: number, cols: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const msg: TerminalMessage = {
        type: "resize",
        data: "",
        rows,
        cols,
      };
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !resourceId) {
      isConnectingRef.current = false;
      return;
    }

    const connectionKey = `terminal-${resourceId}-${container || "default"}-${shell}`;

    // Prevent duplicate connections
    if (isConnectingRef.current || activeConnections.has(connectionKey)) {
      return;
    }

    // Cleanup old connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    isConnectingRef.current = true;
    activeConnections.add(connectionKey);
    connectionKeyRef.current = connectionKey;

    // Build WebSocket URL
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1/api";
    // Convert http(s) to ws(s)
    const wsBaseUrl = baseUrl.replace(/^http/, "ws");

    let url = `${wsBaseUrl}/resources/${resourceId}/exec/terminal?shell=${encodeURIComponent(shell)}`;
    if (container) {
      url += `&container=${encodeURIComponent(container)}`;
    }

    // Get token from store
    const token = useAuthStore.getState().token;

    if (!token) {
      setError("No authentication token found");
      isConnectingRef.current = false;
      activeConnections.delete(connectionKey);
      return;
    }

    try {
      // Note: WebSocket doesn't support custom headers in browsers
      // We'll need to send the token as query param or handle it differently
      // For now, adding as query param
      url += `&token=${encodeURIComponent(token)}`;

      console.log("[useTerminal] Creating WebSocket connection to:", url);
      console.log("[useTerminal] Token length:", token.length);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      console.log("[useTerminal] WebSocket created, readyState:", ws.readyState);

      ws.onopen = () => {
        console.log("[useTerminal] WebSocket OPENED successfully");
        setIsConnected(true);
        setError(null);
        isConnectingRef.current = false;
        shouldReconnectRef.current = true;
      };

      ws.onmessage = event => {
        try {
          const msg: TerminalMessage = JSON.parse(event.data);

          switch (msg.type) {
            case "metadata":
              try {
                setMetadata(JSON.parse(msg.data));
              } catch {
                // Silent fail for metadata parsing
              }
              break;

            case "output":
              if (onOutput) {
                onOutput(msg.data);
              }
              break;

            case "error":
              setError(msg.data);
              setIsConnected(false);
              break;

            case "close":
              setIsConnected(false);
              if (onClose) {
                onClose(msg.data);
              }
              shouldReconnectRef.current = false;
              cleanup();
              break;
          }
        } catch (err) {
          console.error("Failed to parse terminal message:", err);
        }
      };

      ws.onerror = err => {
        console.error("[useTerminal] WebSocket ERROR:", err);
        console.error("[useTerminal] WebSocket readyState on error:", ws.readyState);
        console.error("[useTerminal] WebSocket URL:", ws.url);
        setError("Connection error");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log("[useTerminal] WebSocket CLOSED. Code:", event.code, "Reason:", event.reason, "Was clean:", event.wasClean);
        setIsConnected(false);
        isConnectingRef.current = false;

        // Auto-reconnect if enabled and not intentionally closed
        if (enabled && shouldReconnectRef.current) {
          console.log("[useTerminal] Scheduling reconnect in", RECONNECT_DELAY_MS, "ms");
          reconnectTimeoutRef.current = setTimeout(() => {
            isConnectingRef.current = false;
            connect();
          }, RECONNECT_DELAY_MS);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnected(false);
      isConnectingRef.current = false;
      activeConnections.delete(connectionKey);
    }
  }, [enabled, resourceId, container, shell, onOutput, onClose, cleanup]);

  const reconnect = useCallback(() => {
    setError(null);
    shouldReconnectRef.current = true;
    isConnectingRef.current = false;
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    // Skip if not enabled
    if (!enabled) return;

    const connectionKey = `terminal-${resourceId}-${container || "default"}-${shell}`;

    // Prevent duplicate connections from StrictMode
    if (activeConnections.has(connectionKey)) {
      console.log("[useTerminal] Connection already exists, skipping");
      return;
    }

    // Start connection
    console.log("[useTerminal] Starting new connection");
    connect();

    // Cleanup on unmount
    return () => {
      console.log("[useTerminal] useEffect cleanup triggered");
      shouldReconnectRef.current = false;
      cleanup();
      isConnectingRef.current = false;
      hasInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, resourceId, container, shell]);

  return {
    isConnected,
    error,
    metadata,
    sendInput,
    sendResize,
    reconnect,
    disconnect,
  };
}
