import React from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowNodeData } from "@/stores/WorkflowStore";
import { ServiceNodeData } from "@/lib/types/nodes";

interface ServiceSettingsPanelProps {
  isOpen: boolean;
  nodeId: string | null;
  data: WorkflowNodeData | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: WorkflowNodeData) => void;
  onDelete?: (nodeId: string) => void;
}

export default function ServiceSettingsPanel({
  isOpen,
  nodeId,
  data,
  onClose,
  onUpdate,
  onDelete,
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
        <div className="space-y-2">
          <Label className="text-sm font-medium">Node Name</Label>
          <Input
            value={serviceData.name || ""}
            onChange={e => handleFieldUpdate("name", e.target.value)}
            placeholder="Enter node name"
            className="mt-1.5"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Basic Configuration</h3>

          <div className="space-y-2">
            <Label htmlFor="namespace" className="text-sm">
              Namespace
            </Label>
            <Input
              id="namespace"
              className="mt-1.5"
              value={serviceData.namespace || "default"}
              onChange={e => handleFieldUpdate("namespace", e.target.value)}
              placeholder="default"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetApp" className="text-sm">
              Target Application *
            </Label>
            <Input
              id="targetApp"
              className="mt-1.5"
              value={serviceData.targetApp || ""}
              onChange={e => handleFieldUpdate("targetApp", e.target.value)}
              placeholder="my-app"
            />
            <p className="text-xs text-muted-foreground">
              Name of the application to route traffic to
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType" className="text-sm">
              Service Type *
            </Label>
            <Select
              value={serviceData.serviceType || "ClusterIP"}
              onValueChange={value => handleFieldUpdate("serviceType", value)}
            >
              <SelectTrigger id="serviceType">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="port" className="text-sm">
                Service Port *
              </Label>
              <Input
                id="port"
                className="mt-1.5"
                type="number"
                min="1"
                max="65535"
                value={isNaN(serviceData.port) ? "" : (serviceData.port ?? 80)}
                placeholder="80"
                onChange={e =>
                  handleFieldUpdate("port", parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPort" className="text-sm">
                Target Port
              </Label>
              <Input
                id="targetPort"
                className="mt-1.5"
                type="number"
                min="1"
                max="65535"
                value={
                  serviceData.targetPort
                    ? isNaN(serviceData.targetPort)
                      ? ""
                      : serviceData.targetPort
                    : ""
                }
                placeholder="8080"
                onChange={e =>
                  handleFieldUpdate("targetPort", parseInt(e.target.value))
                }
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Target port defaults to service port if not specified
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Session Affinity</h3>
          <Select
            value={serviceData.sessionAffinity || "None"}
            onValueChange={value => handleFieldUpdate("sessionAffinity", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select session affinity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="ClientIP">ClientIP</SelectItem>
            </SelectContent>
          </Select>
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
          <Button variant="outline" size="sm" className="w-full">
            Add Label
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Annotations</h3>
          <p className="text-xs text-muted-foreground">
            Add annotations for service-specific configurations
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Add Annotation
          </Button>
        </div>

        <Separator />

        {/* Delete button at the bottom */}
        <div className="pt-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
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
        </div>
      </div>
    </div>
  );
}
