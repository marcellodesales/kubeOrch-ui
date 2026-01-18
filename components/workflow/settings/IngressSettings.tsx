import React from "react";
import {
  Globe,
  Server,
  Route,
  Lock,
  AlertCircle,
  CheckCircle2,
  Clock,
  Link2,
  Plus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { IngressNodeData, IngressPath } from "@/lib/types/nodes";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { WorkflowNodeData } from "@/stores/WorkflowStore";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

// Generate a unique ID for new path entries
const generatePathId = () =>
  `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Status renderer for Ingress nodes
function IngressStatus({ data }: { data: IngressNodeData }) {
  if (!data._status) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge
          variant={
            data._status.state === "healthy"
              ? "default"
              : data._status.state === "pending"
                ? "secondary"
                : "destructive"
          }
          className="flex items-center gap-1"
        >
          {data._status.state === "healthy" && (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {data._status.state === "pending" && <Clock className="h-3 w-3" />}
          {data._status.state === "error" && (
            <AlertCircle className="h-3 w-3" />
          )}
          {data._status.state || "Unknown"}
        </Badge>
      </div>

      <div className="space-y-2 rounded-md bg-muted/50 p-3">
        {/* Load Balancer IP */}
        {data._status.loadBalancerIP && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              Load Balancer IP
            </span>
            <code className="text-xs bg-background px-2 py-0.5 rounded font-semibold text-green-600">
              {data._status.loadBalancerIP}
            </code>
          </div>
        )}

        {/* Load Balancer Hostname */}
        {data._status.loadBalancerHostname && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-3.5 w-3.5" />
              Hostname
            </span>
            <code className="text-xs bg-background px-2 py-0.5 rounded font-semibold text-green-600 max-w-[180px] truncate">
              {data._status.loadBalancerHostname}
            </code>
          </div>
        )}

        {/* Pending state - no IP/Hostname yet */}
        {!data._status.loadBalancerIP && !data._status.loadBalancerHostname && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              Address
            </span>
            <span className="text-xs text-muted-foreground italic">
              Pending...
            </span>
          </div>
        )}

        {/* Rules count */}
        {data._status.rulesCount !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Route className="h-3.5 w-3.5" />
              Rules
            </span>
            <span className="text-xs">{data._status.rulesCount} rule(s)</span>
          </div>
        )}

        {/* TLS indicator */}
        {data.tlsEnabled && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              TLS
            </span>
            <span className="text-xs text-green-600">Enabled</span>
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

// Paths editor component
function PathsEditor({
  data,
  nodeId,
  editable,
}: {
  data: IngressNodeData;
  nodeId: string;
  editable: boolean;
}) {
  const { updateNodeData } = useWorkflowStore();

  // Ensure paths array exists with at least one path
  const paths: IngressPath[] = data.paths?.length
    ? data.paths
    : [{ id: generatePathId(), path: "/", pathType: "Prefix" }];

  const handlePathChange = (
    pathId: string,
    field: keyof IngressPath,
    value: string | number
  ) => {
    const updatedPaths = paths.map(p =>
      p.id === pathId ? { ...p, [field]: value } : p
    );
    updateNodeData(nodeId, {
      ...data,
      paths: updatedPaths,
    } as unknown as WorkflowNodeData);
  };

  const handleAddPath = () => {
    const newPath: IngressPath = {
      id: generatePathId(),
      path: "/",
      pathType: "Prefix",
    };
    updateNodeData(nodeId, {
      ...data,
      paths: [...paths, newPath],
    } as unknown as WorkflowNodeData);
  };

  const handleRemovePath = (pathId: string) => {
    if (paths.length <= 1) return;
    const updatedPaths = paths.filter(p => p.id !== pathId);
    updateNodeData(nodeId, {
      ...data,
      paths: updatedPaths,
    } as unknown as WorkflowNodeData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Routing Paths</h3>
        {editable && (
          <Button size="sm" variant="outline" onClick={handleAddPath}>
            <Plus className="h-3 w-3 mr-1" />
            Add Path
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Configure URL paths and their backend services
      </p>

      <div className="space-y-3">
        {paths.map((pathEntry, index) => {
          const isLinked = !!pathEntry._linkedService;

          return (
            <div
              key={pathEntry.id}
              className="rounded-md border bg-muted/30 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Path {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {isLinked && (
                    <Badge variant="secondary" className="text-xs">
                      <Link2 className="h-3 w-3 mr-1" />
                      Linked
                    </Badge>
                  )}
                  {paths.length > 1 && editable && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleRemovePath(pathEntry.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Path */}
                <div className="space-y-1">
                  <Label className="text-xs">Path</Label>
                  <DisabledInputWrapper disabled={!editable}>
                    <Input
                      value={pathEntry.path || ""}
                      placeholder="/"
                      onChange={e =>
                        handlePathChange(pathEntry.id, "path", e.target.value)
                      }
                      disabled={!editable}
                      className="h-8 text-sm"
                    />
                  </DisabledInputWrapper>
                </div>

                {/* Path Type */}
                <div className="space-y-1">
                  <Label className="text-xs">Path Type</Label>
                  <DisabledInputWrapper disabled={!editable}>
                    <Select
                      value={pathEntry.pathType || "Prefix"}
                      onValueChange={v =>
                        handlePathChange(pathEntry.id, "pathType", v)
                      }
                      disabled={!editable}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Prefix">Prefix</SelectItem>
                        <SelectItem value="Exact">Exact</SelectItem>
                        <SelectItem value="ImplementationSpecific">
                          Implementation Specific
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </DisabledInputWrapper>
                </div>
              </div>

              {/* Backend Service */}
              <div className="space-y-1">
                <Label className="text-xs">Backend Service</Label>
                {isLinked ? (
                  <div className="flex items-center gap-2 text-sm bg-background rounded-md px-3 py-2 border">
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {pathEntry.serviceName || "Connected Service"}
                    </span>
                    {pathEntry.servicePort && (
                      <span className="text-muted-foreground">
                        :{pathEntry.servicePort}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <DisabledInputWrapper disabled={!editable}>
                      <Input
                        value={pathEntry.serviceName || ""}
                        placeholder="service-name"
                        onChange={e =>
                          handlePathChange(
                            pathEntry.id,
                            "serviceName",
                            e.target.value
                          )
                        }
                        disabled={!editable}
                        className="h-8 text-sm"
                      />
                    </DisabledInputWrapper>
                    <DisabledInputWrapper disabled={!editable}>
                      <Input
                        type="number"
                        value={pathEntry.servicePort || ""}
                        placeholder="80"
                        onChange={e =>
                          handlePathChange(
                            pathEntry.id,
                            "servicePort",
                            parseInt(e.target.value) || 0
                          )
                        }
                        disabled={!editable}
                        className="h-8 text-sm"
                      />
                    </DisabledInputWrapper>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ingressSettingsConfig: NodeSettingsConfig = {
  title: "Ingress Settings",
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
          id: "host",
          label: "Hostname",
          type: "text",
          field: "host",
          placeholder: "api.example.com",
          description: "Optional hostname for routing (leave empty for any)",
        },
        {
          id: "ingressClassName",
          label: "Ingress Class",
          type: "select",
          field: "ingressClassName",
          options: [
            { value: "nginx", label: "nginx" },
            { value: "traefik", label: "traefik" },
            { value: "alb", label: "AWS ALB" },
            { value: "gce", label: "GCE" },
          ],
          description: "Ingress controller class to use",
        },
      ],
    },
    {
      id: "tls",
      title: "TLS Configuration",
      description: "Configure HTTPS/TLS termination",
      fields: [
        {
          id: "tlsEnabled",
          label: "Enable TLS",
          type: "toggle",
          field: "tlsEnabled",
          description: "Enable HTTPS for this ingress",
        },
        {
          id: "tlsSecretName",
          label: "TLS Secret Name",
          type: "text",
          field: "tlsSecretName",
          placeholder: "my-tls-secret",
          description: "Kubernetes secret containing TLS certificate",
        },
      ],
    },
    {
      id: "annotations",
      title: "Annotations",
      description: "Add annotations for controller-specific configurations",
      fields: [],
    },
  ],
  statusRenderer: data => <IngressStatus data={data as IngressNodeData} />,
  extraContent: (data, { nodeId, editable }) => (
    <PathsEditor
      data={data as IngressNodeData}
      nodeId={nodeId}
      editable={editable}
    />
  ),
};
