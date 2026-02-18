"use client";

import React from "react";
import { toast } from "sonner";

// Track globally if toast has been shown this session
let hasShownEditModeToast = false;

interface DisabledInputWrapperProps {
  children: React.ReactNode;
  disabled: boolean;
  className?: string;
}

export function DisabledInputWrapper({
  children,
  disabled,
  className,
}: DisabledInputWrapperProps) {
  const handleMouseEnter = () => {
    if (disabled && !hasShownEditModeToast) {
      hasShownEditModeToast = true;
      toast.info("Switch to edit mode to make changes", {
        duration: 4000,
      });
    }
  };

  if (!disabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={className || "w-full"} onMouseEnter={handleMouseEnter}>
      {children}
    </span>
  );
}
