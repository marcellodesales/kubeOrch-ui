"use client";

import React from "react";
import { toast } from "sonner";

// Track globally if toast has been shown this session
let hasShownEditModeToast = false;

interface DisabledInputWrapperProps {
  children: React.ReactNode;
  disabled: boolean;
}

export function DisabledInputWrapper({
  children,
  disabled,
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
    return <>{children}</>;
  }

  return (
    <span className="w-full" onMouseEnter={handleMouseEnter}>
      {children}
    </span>
  );
}
