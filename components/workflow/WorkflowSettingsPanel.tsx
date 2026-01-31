"use client";

import React, { useState, useEffect } from "react";
import { X, Archive, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Workflow, WorkflowNode, WorkflowEdge } from "@/lib/services/workflow";
import VersionHistory from "@/components/workflow/version/VersionHistory";
import { ImportAnalysis } from "@/lib/services/import";

interface WorkflowSettingsPanelProps {
  isOpen: boolean;
  workflow: Workflow;
  onClose: () => void;
  onUpdate: (workflow: Workflow) => Promise<void>;
  onArchive?: () => void;
  onWorkflowRestore?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onImport?: () => void;
}

export default function WorkflowSettingsPanel({
  isOpen,
  workflow,
  onClose,
  onUpdate,
  onArchive,
  onWorkflowRestore,
  onImport,
}: WorkflowSettingsPanelProps) {
  const [formData, setFormData] = useState({
    name: workflow?.name || "",
    description: workflow?.description || "",
    status: workflow?.status || "draft",
  });
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description || "",
        status: workflow.status,
      });
    }
  }, [workflow]);

  const handleUpdate = async () => {
    await onUpdate({
      ...workflow,
      name: formData.name,
      description: formData.description,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-card border-l shadow-lg transform transition-transform duration-300 ease-in-out z-50 overflow-hidden ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Workflow Settings</h2>
            <Badge
              variant={
                workflow?.status === "published"
                  ? "default"
                  : workflow?.status === "archived"
                    ? "secondary"
                    : "outline"
              }
            >
              {workflow?.status || "draft"}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    className="mt-1.5"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Workflow name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    className="mt-1.5"
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this workflow does..."
                    rows={4}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Metadata</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>
                        {workflow?.created_at
                          ? formatDate(workflow.created_at)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Updated</span>
                      <span>
                        {workflow?.updated_at
                          ? formatDate(workflow.updated_at)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nodes</span>
                      <span>{workflow?.nodes?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Runs</span>
                      <span>{workflow?.run_count || 0}</span>
                    </div>
                    {workflow?.last_run_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Run</span>
                        <span>{formatDate(workflow.last_run_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-4 space-y-2">
              {onImport && (
                <Button
                  onClick={onImport}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import from docker-compose or Git
                </Button>
              )}
              <Button
                onClick={handleUpdate}
                className="w-full"
                disabled={!formData.name}
              >
                Update Workflow
              </Button>
              {workflow?.status !== "archived" && onArchive && (
                <Button
                  onClick={() => setArchiveDialogOpen(true)}
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Workflow
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="history"
            className="flex-1 flex flex-col mt-0 overflow-hidden min-h-0"
          >
            <VersionHistory
              workflowId={workflow?.id}
              onRestore={onWorkflowRestore}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Workflow</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80">
              Are you sure you want to archive &quot;{workflow?.name}&quot;?
              This will also delete all associated Kubernetes resources
              (Deployments, Services).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onArchive?.();
                setArchiveDialogOpen(false);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
