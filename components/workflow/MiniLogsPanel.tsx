"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogLine {
  id: number;
  text: string;
  timestamp: string;
}

interface MiniLogsPanelProps {
  logs: string[];
  isVisible: boolean;
  onClose: () => void;
  maxLines?: number;
  autoCloseDelay?: number;
}

export function MiniLogsPanel({
  logs,
  isVisible,
  onClose,
  maxLines = 5,
  autoCloseDelay = 5000,
}: MiniLogsPanelProps) {
  const [displayedLogs, setDisplayedLogs] = useState<LogLine[]>([]);
  const logIdRef = useRef(0);
  const processedLogsRef = useRef(0);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset auto-close timer whenever new logs arrive
  const resetAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = setTimeout(() => {
      onClose();
    }, autoCloseDelay);
  };

  // Process incoming logs and add them one by one with animation
  useEffect(() => {
    if (!isVisible) {
      setDisplayedLogs([]);
      processedLogsRef.current = 0;
      logIdRef.current = 0;
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      return;
    }

    // Process only new logs
    const newLogs = logs.slice(processedLogsRef.current);
    if (newLogs.length === 0) {
      // Start auto-close timer if no new logs
      resetAutoCloseTimer();
      return;
    }

    // Reset timer since we have new logs
    resetAutoCloseTimer();

    // Add logs one by one with a small delay for fluid animation
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= newLogs.length) {
        clearInterval(interval);
        return;
      }

      const logText = newLogs[currentIndex];
      // Parse timestamp from log format: [timestamp] message
      const match = logText.match(/^\[([^\]]+)\]\s*(.*)$/);
      const timestamp = match ? match[1] : "";
      const text = match ? match[2] : logText;

      const newLog: LogLine = {
        id: logIdRef.current++,
        text,
        timestamp,
      };

      setDisplayedLogs(prev => {
        const updated = [...prev, newLog];
        // Keep only the last maxLines
        if (updated.length > maxLines) {
          return updated.slice(-maxLines);
        }
        return updated;
      });

      currentIndex++;
      processedLogsRef.current++;
    }, 120); // 120ms between each log line for fluid effect

    return () => clearInterval(interval);
  }, [logs, isVisible, maxLines, autoCloseDelay, onClose]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-4 right-4 z-20 w-80"
    >
      <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border bg-muted/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Terminal className="h-3 w-3 text-muted-foreground" />
            <span>Logs</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Logs container with fade gradient */}
        <div className="relative">
          {/* Top fade gradient */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />

          {/* Logs content */}
          <div className="px-2.5 py-2 h-[120px] overflow-hidden font-mono text-[10px] leading-relaxed">
            <div className="flex flex-col justify-end h-full">
              <AnimatePresence mode="popLayout">
                {displayedLogs.map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut",
                    }}
                    className="py-0.5 truncate"
                  >
                    {log.timestamp && (
                      <span className="text-muted-foreground mr-1.5">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    )}
                    <span className="text-foreground">{log.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayedLogs.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground text-center py-2 text-[10px]"
                >
                  Waiting for logs...
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function formatTimestamp(timestamp: string): string {
  // If already in HH:MM:SS format, return as-is
  if (/^\d{2}:\d{2}:\d{2}$/.test(timestamp)) {
    return timestamp;
  }

  // Try to parse as ISO date
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // Extract time portion if present
  const timeMatch = timestamp.match(/(\d{2}:\d{2}:\d{2})/);
  return timeMatch ? timeMatch[1] : timestamp;
}
