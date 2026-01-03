import React from "react";
import { X, Trash2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { WorkflowNodeData } from "@/stores/WorkflowStore";
import { DeploymentNodeData } from "@/lib/types/nodes";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

interface DeploymentSettingsPanelProps {
  isOpen: boolean;
  nodeId: string | null;
  data: WorkflowNodeData | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: WorkflowNodeData) => void;
  onDelete?: (nodeId: string) => void;
  editable?: boolean;
}

export default function DeploymentSettingsPanel({
  isOpen,
  nodeId,
  data,
  onClose,
  onUpdate,
  onDelete,
  editable = true,
}: DeploymentSettingsPanelProps) {
  if (!isOpen || !data || !nodeId) return null;

  // Type guard to ensure we're working with DeploymentNodeData
  const deploymentData = data as DeploymentNodeData;

  const handleFieldUpdate = (
    field: string,
    value: string | number | boolean
  ) => {
    const updatedData = { ...data };
    const paths = field.split(".");
    let current: Record<string, unknown> = updatedData as Record<
      string,
      unknown
    >;

    for (let i = 0; i < paths.length - 1; i++) {
      if (!current[paths[i]]) {
        current[paths[i]] = {};
      }
      current = current[paths[i]] as Record<string, unknown>;
    }

    current[paths[paths.length - 1]] = value;
    onUpdate(nodeId, updatedData);
  };

  const handlePortChange = (field: string, value: string) => {
    // Allow empty string for clearing the field
    if (value === "") {
      handleFieldUpdate(field, NaN);
      return;
    }
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, "");
    const numValue = parseInt(digitsOnly, 10);
    if (!isNaN(numValue)) {
      // Reject if over max port
      if (numValue > 65535) {
        return;
      }
      handleFieldUpdate(field, numValue);
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg transform transition-transform duration-300 z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Deployment Settings</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-80px)]">
        {/* Status Section */}
        {deploymentData._status && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Status</h3>
                {deploymentData._status.state === "partial" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-help"
                      >
                        <AlertCircle className="h-3 w-3" />
                        partial
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {deploymentData._status.readyReplicas ?? 0} /{" "}
                      {deploymentData._status.replicas} pods ready
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Badge
                    variant={
                      deploymentData._status.state === "healthy"
                        ? "default"
                        : "destructive"
                    }
                    className="flex items-center gap-1"
                  >
                    {deploymentData._status.state === "healthy" && (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {deploymentData._status.state === "error" && (
                      <XCircle className="h-3 w-3" />
                    )}
                    {deploymentData._status.state || "Unknown"}
                  </Badge>
                )}
              </div>

              {/* Error box - only show for error state */}
              {deploymentData._status.state === "error" &&
                deploymentData._status.message && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-xs text-destructive">
                      {deploymentData._status.message}
                    </p>
                  </div>
                )}
            </div>
            <Separator />
          </>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Node Name</Label>
          <DisabledInputWrapper disabled={!editable}>
            <Input
              value={data.name || ""}
              onChange={e => handleFieldUpdate("name", e.target.value)}
              placeholder="Enter node name"
              className="mt-1.5"
              disabled={!editable}
            />
          </DisabledInputWrapper>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Basic Configuration</h3>

          <div className="space-y-2">
            <Label htmlFor="namespace" className="text-sm">
              Namespace
            </Label>
            <DisabledInputWrapper disabled={!editable}>
              <Input
                id="namespace"
                className="mt-1.5"
                value={data.namespace || "default"}
                onChange={e => handleFieldUpdate("namespace", e.target.value)}
                placeholder="default"
                disabled={!editable}
              />
            </DisabledInputWrapper>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm">
              Docker Image *
            </Label>
            <DisabledInputWrapper disabled={!editable}>
              <Input
                id="image"
                className="mt-1.5"
                value={data.image || ""}
                onChange={e => handleFieldUpdate("image", e.target.value)}
                placeholder="myorg/backend:1.0"
                disabled={!editable}
              />
            </DisabledInputWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="replicas" className="text-sm">
                Replicas *
              </Label>
              <DisabledInputWrapper disabled={!editable}>
                <Input
                  id="replicas"
                  className="mt-1.5"
                  type="number"
                  min="0"
                  value={isNaN(data.replicas) ? "" : (data.replicas ?? 1)}
                  placeholder="1"
                  onChange={e =>
                    handleFieldUpdate("replicas", parseInt(e.target.value))
                  }
                  disabled={!editable}
                />
              </DisabledInputWrapper>
            </div>

            <div className="space-y-2">
              <Label htmlFor="port" className="text-sm">
                Port *
              </Label>
              <DisabledInputWrapper disabled={!editable}>
                <Input
                  id="port"
                  className="mt-1.5"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={isNaN(data.port) ? "" : (data.port ?? 8080)}
                  placeholder="8080"
                  onChange={e => handlePortChange("port", e.target.value)}
                  disabled={!editable}
                />
              </DisabledInputWrapper>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Resource Limits</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="limits-cpu" className="text-sm">
                CPU Limit
              </Label>
              <DisabledInputWrapper disabled={!editable}>
                <Input
                  id="limits-cpu"
                  value={data.resources?.limits?.cpu || ""}
                  onChange={e =>
                    handleFieldUpdate("resources.limits.cpu", e.target.value)
                  }
                  placeholder="500m"
                  disabled={!editable}
                />
              </DisabledInputWrapper>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limits-memory" className="text-sm">
                Memory Limit
              </Label>
              <DisabledInputWrapper disabled={!editable}>
                <Input
                  id="limits-memory"
                  value={data.resources?.limits?.memory || ""}
                  onChange={e =>
                    handleFieldUpdate("resources.limits.memory", e.target.value)
                  }
                  placeholder="512Mi"
                  disabled={!editable}
                />
              </DisabledInputWrapper>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Resource Requests</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="requests-cpu" className="text-sm">
                CPU Request
              </Label>
              <DisabledInputWrapper disabled={!editable}>
                <Input
                  id="requests-cpu"
                  value={data.resources?.requests?.cpu || ""}
                  onChange={e =>
                    handleFieldUpdate("resources.requests.cpu", e.target.value)
                  }
                  placeholder="250m"
                  disabled={!editable}
                />
              </DisabledInputWrapper>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requests-memory" className="text-sm">
                Memory Request
              </Label>
              <DisabledInputWrapper disabled={!editable}>
                <Input
                  id="requests-memory"
                  value={data.resources?.requests?.memory || ""}
                  onChange={e =>
                    handleFieldUpdate(
                      "resources.requests.memory",
                      e.target.value
                    )
                  }
                  placeholder="256Mi"
                  disabled={!editable}
                />
              </DisabledInputWrapper>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Environment Variables</h3>
          <p className="text-xs text-muted-foreground">
            Add environment variables as key-value pairs
          </p>
          <DisabledInputWrapper disabled={!editable}>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!editable}
            >
              Add Environment Variable
            </Button>
          </DisabledInputWrapper>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Labels</h3>
          <p className="text-xs text-muted-foreground">
            Add custom labels for your deployment
          </p>
          <DisabledInputWrapper disabled={!editable}>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!editable}
            >
              Add Label
            </Button>
          </DisabledInputWrapper>
        </div>

        <Separator />

        {/* Delete button at the bottom */}
        <div className="pt-4">
          <DisabledInputWrapper disabled={!editable}>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              disabled={!editable}
              onClick={() => {
                if (onDelete && nodeId) {
                  onDelete(nodeId);
                  onClose();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Node
            </Button>
          </DisabledInputWrapper>
        </div>
      </div>
    </div>
  );
}
