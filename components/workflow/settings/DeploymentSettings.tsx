import React from "react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { DeploymentNodeData } from "@/lib/types/nodes";

// Status renderer for Deployment nodes
function DeploymentStatus({
  data,
}: {
  data: DeploymentNodeData;
  editable: boolean;
}) {
  if (!data._status) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        {data._status.state === "partial" ? (
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
              {data._status.readyReplicas ?? 0} / {data._status.replicas} pods
              ready
            </TooltipContent>
          </Tooltip>
        ) : (
          <Badge
            variant={
              data._status.state === "healthy" ? "default" : "destructive"
            }
            className="flex items-center gap-1"
          >
            {data._status.state === "healthy" && (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {data._status.state === "error" && <XCircle className="h-3 w-3" />}
            {data._status.state || "Unknown"}
          </Badge>
        )}
      </div>

      {/* Error box - only show for error state */}
      {data._status.state === "error" && data._status.message && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{data._status.message}</p>
        </div>
      )}
    </div>
  );
}

export const deploymentSettingsConfig: NodeSettingsConfig = {
  title: "Deployment Settings",
  sections: [
    {
      id: "basic",
      title: "Basic Configuration",
      fields: [
        {
          id: "namespace",
          label: "Namespace",
          type: "text",
          field: "namespace",
          placeholder: "default",
        },
        {
          id: "image",
          label: "Docker Image *",
          type: "text",
          field: "image",
          placeholder: "myorg/backend:1.0",
          required: true,
        },
        {
          id: "replicas-port-group",
          type: "group",
          fields: [
            {
              id: "replicas",
              label: "Replicas *",
              type: "number",
              field: "replicas",
              placeholder: "1",
              min: 0,
            },
            {
              id: "port",
              label: "Port *",
              type: "port",
              field: "port",
              placeholder: "8080",
            },
          ],
        },
      ],
    },
    {
      id: "limits",
      title: "Resource Limits",
      fields: [
        {
          id: "limits-group",
          type: "group",
          fields: [
            {
              id: "cpu-limit",
              label: "CPU Limit",
              type: "text",
              field: "resources.limits.cpu",
              placeholder: "500m",
            },
            {
              id: "mem-limit",
              label: "Memory Limit",
              type: "text",
              field: "resources.limits.memory",
              placeholder: "512Mi",
            },
          ],
        },
      ],
    },
    {
      id: "requests",
      title: "Resource Requests",
      fields: [
        {
          id: "requests-group",
          type: "group",
          fields: [
            {
              id: "cpu-request",
              label: "CPU Request",
              type: "text",
              field: "resources.requests.cpu",
              placeholder: "250m",
            },
            {
              id: "mem-request",
              label: "Memory Request",
              type: "text",
              field: "resources.requests.memory",
              placeholder: "256Mi",
            },
          ],
        },
      ],
    },
    {
      id: "env",
      title: "Environment Variables",
      description: "Add environment variables as key-value pairs",
      fields: [],
    },
  ],
  statusRenderer: (data, editable) => (
    <DeploymentStatus data={data as DeploymentNodeData} editable={editable} />
  ),
};
