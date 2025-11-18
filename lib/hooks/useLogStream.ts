import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/AuthStore";

export interface LogStreamMetadata {
  pod: string;
  container: string;
  namespace: string;
  cluster: string;
}

export interface ParsedLog {
  id: number;
  timestamp: string;
  message: string;
  raw: string;
}

export interface UseLogStreamResult {
  logs: ParsedLog[];
  isConnected: boolean;
  error: string | null;
  metadata: LogStreamMetadata | null;
  clearLogs: () => void;
  reconnect: () => void;
}

const MAX_LOG_LINES = 5000; // Maximum number of log lines to keep in memory
const RECONNECT_DELAY_MS = 3000; // Delay before auto-reconnecting after error

// Global connection tracker to prevent duplicate connections across all instances
const activeConnections = new Set<string>();

export function useLogStream(
  resourceId: string,
  enabled: boolean = true,
  follow: boolean = true,
  tailLines: number = 100
): UseLogStreamResult {
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<LogStreamMetadata | null>(null);
  const eventSourceRef = useRef<{ close: () => void } | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const logIdCounter = useRef(0);
  const connectionKeyRef = useRef<string | null>(null);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);

    // Remove from global tracker using stored key after a small delay
    // This prevents double connections in React StrictMode (mount->unmount->mount)
    if (connectionKeyRef.current) {
      const keyToDelete = connectionKeyRef.current;
      setTimeout(() => {
        activeConnections.delete(keyToDelete);
      }, 100); // Small delay to handle StrictMode double-mount
      connectionKeyRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!enabled || !resourceId) {
      isConnectingRef.current = false;
      return;
    }

    const connectionKey = `${resourceId}-${follow}-${tailLines}`;

    // Prevent duplicate connections globally
    if (isConnectingRef.current || activeConnections.has(connectionKey)) {
      return;
    }

    // First cleanup old connection if exists (without removing from set yet)
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Now mark as connecting and add to set
    isConnectingRef.current = true;
    activeConnections.add(connectionKey);
    connectionKeyRef.current = connectionKey;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1/api";
    const url = `${baseUrl}/resources/${resourceId}/logs/stream?follow=${follow}&tail=${tailLines}`;

    // Get token from Zustand store
    const token = useAuthStore.getState().token;

    if (!token) {
      setError("No authentication token found");
      isConnectingRef.current = false;
      return;
    }

    try {
      // Use fetch with streaming to support Authorization headers (EventSource doesn't support custom headers)
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      setIsConnected(true);
      setError(null);
      isConnectingRef.current = false;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Store the reader in ref so we can cancel it
      const abortController = new AbortController();
      eventSourceRef.current = {
        close: () => {
          reader.cancel();
          abortController.abort();
        },
      };

      // Process the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              setIsConnected(false);
              break;
            }

            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });

            // SSE format: "event: eventname\ndata: data\n\n"
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;

              // SSE format allows optional space after colon: "event:value" or "event: value"
              const eventMatch = line.match(/^event:\s*(.+)$/m);
              const dataMatch = line.match(/^data:\s*(.+)$/m);

              if (eventMatch && dataMatch) {
                const eventType = eventMatch[1];
                const data = dataMatch[1];

                switch (eventType) {
                  case "metadata":
                    try {
                      setMetadata(JSON.parse(data));
                    } catch {
                      // Silent fail for metadata parsing
                    }
                    break;
                  case "log":
                    // Parse timestamp and message once when log arrives
                    const timestampMatch = data.match(/^(\S+)\s+(.*)$/);
                    const parsedLog: ParsedLog = {
                      id: logIdCounter.current++,
                      timestamp: timestampMatch?.[1] || "",
                      message: timestampMatch?.[2] || data,
                      raw: data,
                    };

                    setLogs(prev => {
                      const newLogs = [...prev, parsedLog];
                      // Keep only the last MAX_LOG_LINES to prevent memory issues
                      if (newLogs.length > MAX_LOG_LINES) {
                        return newLogs.slice(-MAX_LOG_LINES);
                      }
                      return newLogs;
                    });
                    break;
                  case "error":
                    setError(data);
                    setIsConnected(false);
                    break;
                  case "complete":
                    setIsConnected(false);
                    cleanup();
                    return;
                }
              }
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Stream error");
          setIsConnected(false);

          // Auto-reconnect after delay
          if (follow && enabled) {
            reconnectTimeoutRef.current = setTimeout(() => {
              isConnectingRef.current = false;
              connect();
            }, RECONNECT_DELAY_MS);
          }
        }
      };

      processStream();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnected(false);
      isConnectingRef.current = false;

      // Auto-reconnect after delay
      if (follow && enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          isConnectingRef.current = false;
          connect();
        }, RECONNECT_DELAY_MS);
      }
    }
  }, [enabled, resourceId, follow, tailLines, cleanup]);

  const reconnect = useCallback(() => {
    setLogs([]);
    setError(null);
    isConnectingRef.current = false; // Reset the flag before reconnecting
    connect();
  }, [connect]);

  useEffect(() => {
    // Connect when enabled and parameters change
    connect();

    // Cleanup function that runs on unmount or before re-running effect
    return () => {
      cleanup();
      isConnectingRef.current = false; // Reset connecting flag on cleanup
    };
  }, [connect, cleanup]);

  return {
    logs,
    isConnected,
    error,
    metadata,
    clearLogs,
    reconnect,
  };
}
