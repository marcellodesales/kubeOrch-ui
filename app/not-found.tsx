"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  const content = (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>

        <h1 className="text-9xl font-bold tracking-tighter text-primary/80">
          404
        </h1>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Page not found
          </h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <Link href={isDashboardRoute ? "/dashboard" : "/"}>
          <Button>
            <Home className="mr-2 h-4 w-4" />
            {isDashboardRoute ? "Dashboard" : "Home"}
          </Button>
        </Link>
      </div>
    </div>
  );

  if (isDashboardRoute) {
    return <AppLayout>{content}</AppLayout>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-accent/20">
      {content}
    </div>
  );
}
