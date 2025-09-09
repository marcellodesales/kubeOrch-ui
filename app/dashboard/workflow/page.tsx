import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, GitBranch } from "lucide-react";

export default function WorkflowPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow Designer</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your deployment workflows
          </p>
        </div>
        <Link href="/dashboard/workflow/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Draft</span>
            </div>
            <CardTitle className="text-lg">Sample Workflow</CardTitle>
            <CardDescription>
              Example workflow with multiple deployments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>3 Deployments</p>
              <p>Last modified: 2 hours ago</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
