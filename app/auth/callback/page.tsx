"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/AuthStore";
import api from "@/lib/api";
import { PageLoader } from "@/components/ui/loader";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuthDetails } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(errorParam);
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    if (!code) {
      setError("No authentication code received");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    api
      .post("/auth/oauth/exchange", { code })
      .then(response => {
        const { token, user } = response.data;
        setAuthDetails(token, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          authProvider: user.authProvider,
        });
        router.push("/dashboard");
      })
      .catch(() => {
        setError("Authentication failed. Please try again.");
        setTimeout(() => router.push("/login"), 3000);
      });
  }, [searchParams, router, setAuthDetails]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/20 p-4">
        <div className="text-center space-y-2">
          <p className="text-red-500 text-sm">{error}</p>
          <p className="text-muted-foreground text-sm">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return <PageLoader text="Completing sign in..." />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
