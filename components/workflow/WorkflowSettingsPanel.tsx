"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Workflow } from "@/lib/services/workflow";

interface WorkflowSettingsPanelProps {
  isOpen: boolean;
  workflow: Workflow;
  onClose: () => void;
  onUpdate: (workflow: Workflow) => Promise<void>;
}

export default function WorkflowSettingsPanel({
  isOpen,
  workflow,
  onClose,
  onUpdate,
}: WorkflowSettingsPanelProps) {
  const [formData, setFormData] = useState({
    name: workflow?.name || "",
    description: workflow?.description || "",
    status: workflow?.status || "draft",
  });

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
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Workflow Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Workflow name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this workflow does..."
                rows={4}
              />
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <Badge variant={
                  workflow?.status === "published" ? "default" : 
                  workflow?.status === "archived" ? "secondary" : 
                  "outline"
                }>
                  {workflow?.status || "draft"}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{workflow?.created_at ? formatDate(workflow.created_at) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{workflow?.updated_at ? formatDate(workflow.updated_at) : "-"}</span>
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

            {workflow?.run_count > 0 && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">Run Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Successful</span>
                    <span className="text-green-600">{workflow.success_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="text-red-600">{workflow.failure_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span>
                      {workflow.run_count > 0
                        ? `${Math.round((workflow.success_count / workflow.run_count) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-4">
          <Button
            onClick={handleUpdate}
            className="w-full"
            disabled={!formData.name}
          >
            Update Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}