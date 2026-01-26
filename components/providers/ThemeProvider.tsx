"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";

function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      duration={2000}
      richColors
      theme={resolvedTheme as "light" | "dark"}
    />
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <ToasterWithTheme />
    </NextThemesProvider>
  );
}
