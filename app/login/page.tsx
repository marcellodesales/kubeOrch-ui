import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader } from "@/components/ui/loader";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/20 p-4">
      <Suspense fallback={<Loader size="lg" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
