"use client";

import { useState, useEffect, useCallback } from "react";
import { NavigationSidebar } from "./NavigationSidebar";
import { TopBar } from "./TopBar";
import { GlobalCommandPalette } from "./GlobalCommandPalette";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard handler for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  return (
    <>
      <div className="flex h-screen w-full bg-background">
        <NavigationSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar onOpenCommandPalette={openCommandPalette} />
          <main className="flex-1">{children}</main>
        </div>
      </div>

      <GlobalCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </>
  );
}
