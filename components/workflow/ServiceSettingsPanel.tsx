import React from "react";
import { X, Trash2, Globe, Server, Hash, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowNodeData } from "@/stores/WorkflowStore";
import { ServiceNodeData } from "@/lib/types/nodes";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

interface ServiceSettingsPanelProps {
  isOpen: boolean;
  nodeId: string | null;
  data: WorkflowNodeData | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: WorkflowNodeData) => void;
  onDelete?: (nodeId: string) => void;
  editable?: boolean;
}

export default function ServiceSettingsPanel({
  isOpen,
  nodeId,
  data,
  onClose,
  onUpdate,
  onDelete,
  editable = true,
}: ServiceSettingsPanelProps) {
  if (!isOpen || !data || !nodeId) return null;

  // Type guard to ensure we're working with ServiceNodeData
  const serviceData = data as unknown as ServiceNodeData;

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
        <h2 className="text-lg font-semibold">Service Settings</h2>
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
        {/* Status Section - Only show when deployed */}
        {serviceData._status && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Status</h3>
                <Badge
                  variant={
                    serviceData._status.state === "healthy"
                      ? "default"
                      : serviceData._status.state === "error"
                        ? "destructive"
                        : "secondary"
                  }
                  className="flex items-center gap-1"
                >
                  {serviceData._status.state === "healthy" && (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {serviceData._status.state === "partial" && (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {serviceData._status.state === "error" && (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {serviceData._status.state || "Unknown"}
                </Badge>
              </div>

              <div className="space-y-2 rounded-md bg-muted/50 p-3">
                {serviceData._status.clusterIP && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Server className="h-3.5 w-3.5" />
                      Cluster IP
                    </span>
                    <code className="text-xs bg-background px-2 py-0.5 rounded">
                      {serviceData._status.clusterIP}
                    </code>
                  </div>
                )}

                {serviceData._status.externalIP && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      External IP
                    </span>
                    <code className="text-xs bg-background px-2 py-0.5 rounded font-semibold text-green-600">
                      {serviceData._status.externalIP}
                    </code>
                  </div>
                )}

                {serviceData._status.nodePort && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="h-3.5 w-3.5" />
                      Node Port
                    </span>
                    <code className="text-xs bg-background px-2 py-0.5 rounded">
                      {serviceData._status.nodePort}
                    </code>
                  </div>
                )}

                {serviceData._status.message && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {serviceData._status.message}
                  </p>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Node Name</Label>
          <DisabledInputWrapper disabled={!editable}>
            <Input
              value={serviceData.name || ""}
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
                value={serviceData.namespace || "default"}
                onChange={e => handleFieldUpdate("namespace", e.target.value)}
                placeholder="default"
                disabled={!editable}
              />
            </DisabledInputWrapper>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetApp" className="text-sm">
              Target Application *
            </Label>
            <DisabledInputWrapper disabled={!editable}>
              <Input
                id="targetApp"
                className="mt-1.5"
                value={serviceData.targetApp || ""}
                onChange={e => handleFieldUpdate("targetApp", e.target.value)}
                placeholder="my-app"
                disabled={!editable}
              />
            </DisabledInputWrapper>
            <p className="text-xs text-muted-foreground">
              Name of the application to route traffic to
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType" className="text-sm">
              Service Type *
            </Label>
            <DisabledInputWrapper disabled={!editable}>
              <Select
                value={serviceData.serviceType || "ClusterIP"}
                onValueChange={value => handleFieldUpdate("serviceType", value)}
                disabled={!editable}
              >
                <SelectTrigger id="serviceType" disabled={!editable}>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ClusterIP">
                    ClusterIP - Internal cluster access only
                  </SelectItem>
                  <SelectItem value="NodePort">
                    NodePort - Expose on each node&apos;s IP
                  </SelectItem>
                  <SelectItem value="LoadBalancer">
                    LoadBalancer - External load balancer
                  </SelectItem>
                </SelectContent>
              </Select>
            </DisabledInputWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="port" className="text-sm">
                Service Port *
              </Label>
              <DisabledInputWrapper disabled={!editable}>
                <Input
                  id="port"
                  className="mt-1.5"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={isNaN(serviceData.port) ? "" : (serviceData.port ?? 80)}
                  placeholder="80"
                  onChange={e => handlePortChange("port", e.target.value)}
                  disabled={!editable}
                />
              </DisabledInputWrapper>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPort" className="text-sm">
                Target Port
              </Label>
              <DisabledInputWrapper disabled={!editable}>
                <Input
                  id="targetPort"
                  className="mt-1.5"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={
                    serviceData.targetPort
                      ? isNaN(serviceData.targetPort)
                        ? ""
                        : serviceData.targetPort
                      : ""
                  }
                  placeholder="8080"
                  onChange={e => handlePortChange("targetPort", e.target.value)}
                  disabled={!editable}
                />
              </DisabledInputWrapper>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Target port defaults to service port if not specified
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Session Affinity</h3>
          <DisabledInputWrapper disabled={!editable}>
            <Select
              value={serviceData.sessionAffinity || "None"}
              onValueChange={value => handleFieldUpdate("sessionAffinity", value)}
              disabled={!editable}
            >
              <SelectTrigger disabled={!editable} className="w-full">
                <SelectValue placeholder="Select session affinity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="ClientIP">ClientIP</SelectItem>
              </SelectContent>
            </Select>
          </DisabledInputWrapper>
          <p className="text-xs text-muted-foreground">
            Enable ClientIP to route requests from same client to same pod
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Labels</h3>
          <p className="text-xs text-muted-foreground">
            Add custom labels for your service
          </p>
          <DisabledInputWrapper disabled={!editable}>
            <Button variant="outline" size="sm" className="w-full" disabled={!editable}>
              Add Label
            </Button>
          </DisabledInputWrapper>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Annotations</h3>
          <p className="text-xs text-muted-foreground">
            Add annotations for service-specific configurations
          </p>
          <DisabledInputWrapper disabled={!editable}>
            <Button variant="outline" size="sm" className="w-full" disabled={!editable}>
              Add Annotation
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
