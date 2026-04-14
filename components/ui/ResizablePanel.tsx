"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";

interface ResizablePanelProps {
  children: React.ReactNode;
  width: number;
  minWidth: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
  className?: string;
}

export function ResizablePanel({
  children,
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  className = "",
}: ResizablePanelProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const panelRef = useRef<HTMLDivElement>(null);

  // Update current width when prop changes
  useEffect(() => {
    setCurrentWidth(width);
  }, [width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new width based on mouse position
      // Since panel is fixed to right edge: width = window width - mouse X position
      const newWidth = window.innerWidth - e.clientX;

      // Clamp between min and max
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      setCurrentWidth(clampedWidth);
    },
    [isResizing, minWidth, maxWidth]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      // Persist the final width
      onWidthChange(currentWidth);
    }
  }, [isResizing, currentWidth, onWidthChange]);

  // Attach global mouse event listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Prevent text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={className}
      style={{ width: `${currentWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        role="slider"
        aria-orientation="vertical"
        aria-valuenow={0}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        className={`absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary transition-colors ${
          isResizing ? "bg-primary" : "bg-transparent"
        }`}
        style={{
          zIndex: 100,
        }}
      />

      {/* Panel Content */}
      {children}
    </div>
  );
}
