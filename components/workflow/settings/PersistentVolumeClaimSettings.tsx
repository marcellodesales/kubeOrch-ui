import React, { useCallback } from "react";
import { CheckCircle2, AlertCircle, Clock, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { PersistentVolumeClaimNodeData } from "@/lib/types/nodes";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";

// Status renderer for PVC nodes
function PVCStatus({ data }: { data: PersistentVolumeClaimNodeData }) {
  if (!data._status) return null;

  const getStatusIcon = () => {
    switch (data._status?.state) {
      case "Bound":
        return <CheckCircle2 className="h-3 w-3" />;
      case "Pending":
        return <Clock className="h-3 w-3" />;
      case "Lost":
      case "error":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusVariant = () => {
    switch (data._status?.state) {
      case "Bound":
        return "default" as const;
      case "Pending":
        return "secondary" as const;
      case "Lost":
      case "error":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge variant={getStatusVariant()} className="flex items-center gap-1">
          {getStatusIcon()}
          {data._status.state || "Unknown"}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        {data._status.capacity && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capacity:</span>
            <span className="font-mono">{data._status.capacity}</span>
          </div>
        )}
        {data._status.volumeName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-mono text-xs">{data._status.volumeName}</span>
          </div>
        )}
      </div>

      {data._status.message && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            {data._status.message}
          </p>
        </div>
      )}
    </div>
  );
}

// Access modes editor component
function AccessModesEditor({
  data,
  nodeId,
  editable,
}: {
  data: PersistentVolumeClaimNodeData;
  nodeId: string;
  editable: boolean;
}) {
  const { updateNodeData } = useWorkflowStore();

  const accessModes = data.accessModes || ["ReadWriteOnce"];

  const toggleAccessMode = useCallback(
    (
      mode:
        | "ReadWriteOnce"
        | "ReadOnlyMany"
        | "ReadWriteMany"
        | "ReadWriteOncePod"
    ) => {
      const currentModes = data.accessModes || [];
      const isSelected = currentModes.includes(mode);

      let newModes: typeof currentModes;
      if (isSelected) {
        // Remove mode, but ensure at least one remains
        newModes = currentModes.filter(m => m !== mode);
        if (newModes.length === 0) {
          newModes = ["ReadWriteOnce"];
        }
      } else {
        // Add mode
        newModes = [...currentModes, mode];
      }

      updateNodeData(nodeId, {
        ...data,
        accessModes: newModes,
      } as unknown as WorkflowNodeData);
    },
    [data, nodeId, updateNodeData]
  );

  const modes = [
    {
      value: "ReadWriteOnce" as const,
      label: "ReadWriteOnce (RWO)",
      description: "Can be mounted as read-write by a single node",
    },
    {
      value: "ReadOnlyMany" as const,
      label: "ReadOnlyMany (ROX)",
      description: "Can be mounted as read-only by many nodes",
    },
    {
      value: "ReadWriteMany" as const,
      label: "ReadWriteMany (RWX)",
      description: "Can be mounted as read-write by many nodes",
    },
    {
      value: "ReadWriteOncePod" as const,
      label: "ReadWriteOncePod (RWOP)",
      description: "Can be mounted as read-write by a single pod",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Access Modes</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Select one or more access modes for the volume. At least one mode must
        be selected.
      </p>

      <div className="space-y-3">
        {modes.map(mode => (
          <div key={mode.value} className="flex items-start space-x-3">
            <Checkbox
              id={`access-mode-${mode.value}`}
              checked={accessModes.includes(mode.value)}
              onCheckedChange={() => toggleAccessMode(mode.value)}
              disabled={!editable}
            />
            <div className="grid gap-1 leading-none">
              <Label
                htmlFor={`access-mode-${mode.value}`}
                className="text-sm font-medium cursor-pointer"
              >
                {mode.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {mode.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const persistentVolumeClaimSettingsConfig: NodeSettingsConfig = {
  title: "PersistentVolumeClaim Settings",
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
          id: "storageClassName",
          label: "Storage Class",
          type: "text",
          field: "storageClassName",
          placeholder: "standard (uses cluster default if empty)",
          description:
            "Name of the StorageClass. Leave empty to use the cluster default.",
        },
        {
          id: "storage",
          label: "Storage Size *",
          type: "text",
          field: "storage",
          placeholder: "10Gi",
          required: true,
          description: "Amount of storage to request (e.g., 1Gi, 500Mi, 10Gi)",
        },
      ],
    },
    {
      id: "volume",
      title: "Volume Configuration",
      fields: [
        {
          id: "volumeMode",
          label: "Volume Mode",
          type: "select",
          field: "volumeMode",
          options: [
            { value: "Filesystem", label: "Filesystem (default)" },
            { value: "Block", label: "Block" },
          ],
          description:
            "Filesystem: volume is mounted as a directory. Block: volume is exposed as a raw block device.",
        },
      ],
    },
  ],
  statusRenderer: data => (
    <PVCStatus data={data as PersistentVolumeClaimNodeData} />
  ),
  extraContent: (data, { nodeId, editable }) => (
    <AccessModesEditor
      data={data as PersistentVolumeClaimNodeData}
      nodeId={nodeId}
      editable={editable}
    />
  ),
};
