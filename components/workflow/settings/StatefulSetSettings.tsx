import React from "react";
import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { StatefulSetNodeData } from "@/lib/types/nodes";
import { VolumeClaimTemplatesEditor } from "./VolumeClaimTemplatesEditor";

// Database auth info component - shows auto-configured auth settings
function DatabaseAuthInfo({ data }: { data: StatefulSetNodeData }) {
  const image = data.image?.toLowerCase() || "";
  const env = data.env || {};

  // Check for postgres
  if (image.includes("postgres")) {
    const hasPassword = "POSTGRES_PASSWORD" in env;
    const hasAuthMethod = "POSTGRES_HOST_AUTH_METHOD" in env;

    if (!hasPassword && !hasAuthMethod) {
      return (
        <div className="flex items-start gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-sm">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-blue-500 font-medium">
              Auto-configured for development
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              No password set. Using{" "}
              <code className="bg-muted px-1 rounded">
                POSTGRES_HOST_AUTH_METHOD=trust
              </code>{" "}
              (allows all connections). For production, add{" "}
              <code className="bg-muted px-1 rounded">POSTGRES_PASSWORD</code>{" "}
              via Environment Variables or connect a Secret.
            </p>
          </div>
        </div>
      );
    }
  }

  // Check for mysql/mariadb
  if (image.includes("mysql") || image.includes("mariadb")) {
    const hasRootPassword = "MYSQL_ROOT_PASSWORD" in env;
    const hasAllowEmpty = "MYSQL_ALLOW_EMPTY_PASSWORD" in env;
    const hasRandomRoot = "MYSQL_RANDOM_ROOT_PASSWORD" in env;

    if (!hasRootPassword && !hasAllowEmpty && !hasRandomRoot) {
      return (
        <div className="flex items-start gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-sm">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-blue-500 font-medium">
              Auto-configured for development
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              No password set. Using{" "}
              <code className="bg-muted px-1 rounded">
                MYSQL_ALLOW_EMPTY_PASSWORD=yes
              </code>
              . For production, add{" "}
              <code className="bg-muted px-1 rounded">MYSQL_ROOT_PASSWORD</code>{" "}
              via Environment Variables or connect a Secret.
            </p>
          </div>
        </div>
      );
    }
  }

  return null;
}

// Status renderer for StatefulSet nodes
function StatefulSetStatus({
  data,
}: {
  data: StatefulSetNodeData;
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

      {/* Replica counts for partial state */}
      {data._status.state === "partial" && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ready Replicas:</span>
            <span>
              {data._status.readyReplicas ?? 0} / {data._status.replicas ?? 0}
            </span>
          </div>
          {data._status.currentReplicas !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Replicas:</span>
              <span>{data._status.currentReplicas}</span>
            </div>
          )}
        </div>
      )}

      {/* Error box - only show for error state */}
      {data._status.state === "error" && data._status.message && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{data._status.message}</p>
        </div>
      )}
    </div>
  );
}

export const statefulSetSettingsConfig: NodeSettingsConfig = {
  title: "StatefulSet Settings",
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
          placeholder: "postgres:18",
          required: true,
        },
        {
          id: "serviceName",
          label: "Headless Service Name *",
          type: "text",
          field: "serviceName",
          placeholder: "postgres-headless",
          required: true,
          description:
            "Name of the headless service for pod DNS. Pods get DNS names like pod-0.serviceName.namespace.svc.cluster.local",
        },
        {
          id: "replicas-port-group",
          type: "group",
          fields: [
            {
              id: "replicas",
              label: "Replicas",
              type: "number",
              field: "replicas",
              placeholder: "1",
              min: 0,
            },
            {
              id: "port",
              label: "Port",
              type: "port",
              field: "port",
              placeholder: "5432",
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
              placeholder: "1000m",
            },
            {
              id: "mem-limit",
              label: "Memory Limit",
              type: "text",
              field: "resources.limits.memory",
              placeholder: "1Gi",
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
              placeholder: "500m",
            },
            {
              id: "mem-request",
              label: "Memory Request",
              type: "text",
              field: "resources.requests.memory",
              placeholder: "512Mi",
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
    <StatefulSetStatus data={data as StatefulSetNodeData} editable={editable} />
  ),
  extraContent: (data, { nodeId, editable }) => (
    <>
      <DatabaseAuthInfo data={data as StatefulSetNodeData} />
      <VolumeClaimTemplatesEditor
        data={data as StatefulSetNodeData}
        nodeId={nodeId}
        editable={editable}
      />
    </>
  ),
};
