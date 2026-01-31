"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntegrationsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to registries by default
    router.replace("/dashboard/integrations/registries");
  }, [router]);

  return null;
}
