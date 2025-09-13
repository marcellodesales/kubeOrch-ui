import React from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DeploymentRequest } from "@/lib/services/deployment";

interface DeploymentSettingsPanelProps {
  isOpen: boolean;
  nodeId: string | null;
  data: DeploymentRequest | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: DeploymentRequest) => void;
  onDelete?: (nodeId: string) => void;
}

export default function DeploymentSettingsPanel({
  isOpen,
  nodeId,
  data,
  onClose,
  onUpdate,
  onDelete,
}: DeploymentSettingsPanelProps) {
  if (!isOpen || !data || !nodeId) return null;

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
        <div className="space-y-2">
          <Label className="text-sm font-medium">Deployment ID</Label>
          <Input
            value={data.id || ""}
            disabled
            placeholder="Auto-generated from image"
            className="bg-muted mt-1.5"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Basic Configuration</h3>

          <div className="space-y-2">
            <Label htmlFor="templateId" className="text-sm">
              Template ID
            </Label>
            <Input
              id="templateId"
              className="mt-1.5"
              value={data.templateId || ""}
              onChange={e => handleFieldUpdate("templateId", e.target.value)}
              placeholder="applications/api/nodejs-api"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm">
              Docker Image *
            </Label>
            <Input
              id="image"
              className="mt-1.5"
              value={data.parameters?.image || ""}
              onChange={e =>
                handleFieldUpdate("parameters.image", e.target.value)
              }
              placeholder="myorg/backend:1.0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="replicas" className="text-sm">
                Replicas *
              </Label>
              <Input
                id="replicas"
                className="mt-1.5"
                type="number"
                min="1"
                value={data.parameters?.replicas || 1}
                onChange={e =>
                  handleFieldUpdate(
                    "parameters.replicas",
                    parseInt(e.target.value)
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port" className="text-sm">
                Port *
              </Label>
              <Input
                id="port"
                className="mt-1.5"
                type="number"
                min="1"
                max="65535"
                value={data.parameters?.port || 8080}
                onChange={e =>
                  handleFieldUpdate("parameters.port", parseInt(e.target.value))
                }
              />
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
              <Input
                id="limits-cpu"
                value={data.parameters?.resources?.limits?.cpu || ""}
                onChange={e =>
                  handleFieldUpdate(
                    "parameters.resources.limits.cpu",
                    e.target.value
                  )
                }
                placeholder="500m"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limits-memory" className="text-sm">
                Memory Limit
              </Label>
              <Input
                id="limits-memory"
                value={data.parameters?.resources?.limits?.memory || ""}
                onChange={e =>
                  handleFieldUpdate(
                    "parameters.resources.limits.memory",
                    e.target.value
                  )
                }
                placeholder="512Mi"
              />
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
              <Input
                id="requests-cpu"
                value={data.parameters?.resources?.requests?.cpu || ""}
                onChange={e =>
                  handleFieldUpdate(
                    "parameters.resources.requests.cpu",
                    e.target.value
                  )
                }
                placeholder="250m"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requests-memory" className="text-sm">
                Memory Request
              </Label>
              <Input
                id="requests-memory"
                value={data.parameters?.resources?.requests?.memory || ""}
                onChange={e =>
                  handleFieldUpdate(
                    "parameters.resources.requests.memory",
                    e.target.value
                  )
                }
                placeholder="256Mi"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Environment Variables</h3>
          <p className="text-xs text-muted-foreground">
            Add environment variables as key-value pairs
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Add Environment Variable
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Labels</h3>
          <p className="text-xs text-muted-foreground">
            Add custom labels for your deployment
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Add Label
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
