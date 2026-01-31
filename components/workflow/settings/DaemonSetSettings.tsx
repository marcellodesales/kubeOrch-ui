import React from "react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { DaemonSetNodeData } from "@/lib/types/nodes";
import { EnvVarsEditor } from "./EnvVarsEditor";

// Status renderer for DaemonSet nodes
function DaemonSetStatus({
  data,
}: {
  data: DaemonSetNodeData;
  editable: boolean;
}) {
  if (!data._status) return null;

  const getStatusVariant = () => {
    switch (data._status?.state) {
      case "healthy":
        return "default";
      case "partial":
        return "secondary";
      default:
        return "destructive";
    }
  };

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
              {data._status.numberReady ?? 0} /{" "}
              {data._status.desiredNumberScheduled} pods ready
            </TooltipContent>
          </Tooltip>
        ) : (
          <Badge
            variant={getStatusVariant()}
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

      {data._status.desiredNumberScheduled !== undefined && (
        <div className="text-xs text-muted-foreground">
          Nodes: {data._status.numberReady ?? 0} /{" "}
          {data._status.desiredNumberScheduled} ready
          {data._status.numberAvailable !== undefined &&
            ` | ${data._status.numberAvailable} available`}
        </div>
      )}

      {data._status.state === "error" && data._status.message && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{data._status.message}</p>
        </div>
      )}
    </div>
  );
}

export const daemonSetSettingsConfig: NodeSettingsConfig = {
  title: "DaemonSet Settings",
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
          placeholder: "fluentd:v1.16",
          required: true,
        },
        {
          id: "port-strategy-group",
          type: "group",
          fields: [
            {
              id: "port",
              label: "Port",
              type: "port",
              field: "port",
              placeholder: "8080",
            },
            {
              id: "updateStrategy",
              label: "Update Strategy",
              type: "select",
              field: "updateStrategy",
              options: [
                { value: "RollingUpdate", label: "RollingUpdate" },
                { value: "OnDelete", label: "OnDelete" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "scheduling",
      title: "Node Scheduling",
      fields: [
        {
          id: "hostNetwork",
          label: "Host Network",
          type: "toggle",
          field: "hostNetwork",
        },
        {
          id: "hostPID",
          label: "Host PID",
          type: "toggle",
          field: "hostPID",
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
  ],
  statusRenderer: (data, editable) => (
    <DaemonSetStatus data={data as DaemonSetNodeData} editable={editable} />
  ),
  extraContent: (data, { nodeId, editable }) => (
    <EnvVarsEditor
      data={data as DaemonSetNodeData}
      nodeId={nodeId}
      editable={editable}
    />
  ),
};
