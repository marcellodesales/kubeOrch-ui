import React from "react";
import { Globe, Server, Hash, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { ServiceNodeData } from "@/lib/types/nodes";
import { ServiceDiagnosticsPanel } from "../ServiceDiagnosticsPanel";

// Status renderer for Service nodes
function ServiceStatus({ data }: { data: ServiceNodeData; editable: boolean }) {
  if (!data._status) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge
          variant={
            data._status.state === "healthy"
              ? "default"
              : data._status.state === "error"
                ? "destructive"
                : "secondary"
          }
          className="flex items-center gap-1"
        >
          {data._status.state === "healthy" && (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {data._status.state === "partial" && (
            <AlertCircle className="h-3 w-3" />
          )}
          {data._status.state === "error" && (
            <AlertCircle className="h-3 w-3" />
          )}
          {data._status.state || "Unknown"}
        </Badge>
      </div>

      <div className="space-y-2 rounded-md bg-muted/50 p-3">
        {/* Cluster IP - always show for all types */}
        {data._status.clusterIP && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-3.5 w-3.5" />
              Cluster IP
            </span>
            <code className="text-xs bg-background px-2 py-0.5 rounded">
              {data._status.clusterIP}
            </code>
          </div>
        )}

        {/* Node Port - only show for NodePort type */}
        {data.serviceType === "NodePort" && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              Node Port
            </span>
            <code className="text-xs bg-background px-2 py-0.5 rounded">
              {data._status.nodePort || "—"}
            </code>
          </div>
        )}

        {/* External IP - only show for LoadBalancer type */}
        {data.serviceType === "LoadBalancer" && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              External IP
            </span>
            {data._status.externalIP ? (
              <code className="text-xs bg-background px-2 py-0.5 rounded font-semibold text-green-600">
                {data._status.externalIP}
              </code>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Pending...
              </span>
            )}
          </div>
        )}

        {data._status.message && (
          <p className="text-xs text-muted-foreground mt-2">
            {data._status.message}
          </p>
        )}
      </div>
    </div>
  );
}

export const serviceSettingsConfig: NodeSettingsConfig = {
  title: "Service Settings",
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
          id: "targetApp",
          label: "Target Application *",
          type: "text",
          field: "targetApp",
          placeholder: "my-app",
          description: "Name of the application to route traffic to",
        },
        {
          id: "serviceType",
          label: "Service Type *",
          type: "select",
          field: "serviceType",
          options: [
            { value: "ClusterIP", label: "ClusterIP" },
            { value: "NodePort", label: "NodePort" },
            { value: "LoadBalancer", label: "LoadBalancer" },
          ],
        },
        {
          id: "ports-group",
          type: "group",
          description: "Target port defaults to service port if not specified",
          fields: [
            {
              id: "port",
              label: "Service Port *",
              type: "port",
              field: "port",
              placeholder: "80",
            },
            {
              id: "targetPort",
              label: "Target Port",
              type: "port",
              field: "targetPort",
              placeholder: "8080",
            },
          ],
        },
      ],
    },
    {
      id: "affinity",
      title: "Session Affinity",
      fields: [
        {
          id: "sessionAffinity",
          type: "select",
          field: "sessionAffinity",
          options: [
            { value: "None", label: "None" },
            { value: "ClientIP", label: "ClientIP" },
          ],
          description:
            "Enable ClientIP to route requests from same client to same pod",
        },
      ],
    },
    {
      id: "annotations",
      title: "Annotations",
      description: "Add annotations for service-specific configurations",
      fields: [],
    },
  ],
  statusRenderer: (data, editable) => (
    <ServiceStatus data={data as ServiceNodeData} editable={editable} />
  ),
  extraContent: (data, { workflowId, nodeId }) => {
    const serviceData = data as ServiceNodeData;
    if (serviceData._status && workflowId && nodeId) {
      return (
        <ServiceDiagnosticsPanel
          workflowId={workflowId}
          nodeId={nodeId}
          serviceStatus={serviceData._status}
        />
      );
    }
    return null;
  },
};
