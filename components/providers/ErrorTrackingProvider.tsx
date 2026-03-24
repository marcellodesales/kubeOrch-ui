"use client";

import { useEffect } from "react";
import { errorReporter } from "@/lib/utils/errorReporter";

export function ErrorTrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    errorReporter.initGlobalHandlers();
  }, []);

  return <>{children}</>;
}
