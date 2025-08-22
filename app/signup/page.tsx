import { RegisterForm } from "@/components/auth/RegisterForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/20 p-4">
      <RegisterForm />
    </div>
  );
}
