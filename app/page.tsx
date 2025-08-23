import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">KubeOrchestra</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Visual Kubernetes workflow orchestrator that transforms complex YAML
            configurations into intuitive drag-and-drop interfaces
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button size="lg">Get Started</Button>
          </Link>
          <Button variant="ghost" size="lg">
            Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}
