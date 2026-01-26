import React, { useCallback } from "react";
import { HardDrive, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StatefulSetNodeData, VolumeClaimTemplate } from "@/lib/types/nodes";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

// Generate a unique ID for new volume claim templates
const generateVCTId = () =>
  `vct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface VolumeClaimTemplatesEditorProps {
  data: StatefulSetNodeData;
  nodeId: string;
  editable: boolean;
}

export function VolumeClaimTemplatesEditor({
  data,
  nodeId,
  editable,
}: VolumeClaimTemplatesEditorProps) {
  const { updateNodeData } = useWorkflowStore();

  const templates = data.volumeClaimTemplates || [];

  // Check if external PVC is attached (checked after hooks to follow React rules)
  const hasLinkedPVCs = (data._linkedPVCs?.length ?? 0) > 0;

  const handleTemplateChange = useCallback(
    (
      templateId: string,
      field: keyof VolumeClaimTemplate,
      value: string | string[]
    ) => {
      const updatedTemplates = templates.map(t =>
        t.id === templateId ? { ...t, [field]: value } : t
      );
      updateNodeData(nodeId, {
        ...data,
        volumeClaimTemplates: updatedTemplates,
      } as unknown as WorkflowNodeData);
    },
    [templates, data, nodeId, updateNodeData]
  );

  const handleAccessModeToggle = useCallback(
    (
      templateId: string,
      mode: "ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany"
    ) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const currentModes = template.accessModes || [];
      const isSelected = currentModes.includes(mode);

      let newModes: typeof currentModes;
      if (isSelected) {
        newModes = currentModes.filter(m => m !== mode);
        if (newModes.length === 0) {
          newModes = ["ReadWriteOnce"];
        }
      } else {
        newModes = [...currentModes, mode];
      }

      handleTemplateChange(templateId, "accessModes", newModes);
    },
    [templates, handleTemplateChange]
  );

  const handleAddTemplate = useCallback(() => {
    const newTemplate: VolumeClaimTemplate = {
      id: generateVCTId(),
      name: "data",
      accessModes: ["ReadWriteOnce"],
      storage: "10Gi",
    };
    updateNodeData(nodeId, {
      ...data,
      volumeClaimTemplates: [...templates, newTemplate],
    } as unknown as WorkflowNodeData);
  }, [templates, data, nodeId, updateNodeData]);

  const handleRemoveTemplate = useCallback(
    (templateId: string) => {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      updateNodeData(nodeId, {
        ...data,
        volumeClaimTemplates: updatedTemplates,
      } as unknown as WorkflowNodeData);
    },
    [templates, data, nodeId, updateNodeData]
  );

  const accessModeOptions = [
    {
      value: "ReadWriteOnce" as const,
      label: "RWO",
      description: "Single node read-write",
    },
    {
      value: "ReadOnlyMany" as const,
      label: "ROX",
      description: "Many nodes read-only",
    },
    {
      value: "ReadWriteMany" as const,
      label: "RWX",
      description: "Many nodes read-write",
    },
  ];

  // Don't show volume claim templates if an external PVC is attached
  if (hasLinkedPVCs) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Volume Claim Templates</h3>
        </div>
        {editable && (
          <Button size="sm" variant="outline" onClick={handleAddTemplate}>
            <Plus className="h-3 w-3 mr-1" />
            Add Volume
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Define persistent storage volumes that will be automatically provisioned
        for each pod replica. Each volume is mounted at /data/[name].
      </p>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
            No volume claim templates. Click &quot;Add Volume&quot; to create
            one.
          </div>
        ) : (
          templates.map((template, index) => (
            <div
              key={template.id}
              className="rounded-md border bg-muted/30 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Volume {index + 1}
                </span>
                {editable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleRemoveTemplate(template.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Name and Storage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <DisabledInputWrapper disabled={!editable}>
                    <Input
                      value={template.name || ""}
                      placeholder="data"
                      onChange={e =>
                        handleTemplateChange(
                          template.id,
                          "name",
                          e.target.value
                        )
                      }
                      disabled={!editable}
                      className="h-8 text-sm"
                    />
                  </DisabledInputWrapper>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Storage Size</Label>
                  <DisabledInputWrapper disabled={!editable}>
                    <Input
                      value={template.storage || ""}
                      placeholder="10Gi"
                      onChange={e =>
                        handleTemplateChange(
                          template.id,
                          "storage",
                          e.target.value
                        )
                      }
                      disabled={!editable}
                      className="h-8 text-sm"
                    />
                  </DisabledInputWrapper>
                </div>
              </div>

              {/* Storage Class */}
              <div className="space-y-1">
                <Label className="text-xs">Storage Class (optional)</Label>
                <DisabledInputWrapper disabled={!editable}>
                  <Input
                    value={template.storageClassName || ""}
                    placeholder="Uses cluster default if empty"
                    onChange={e =>
                      handleTemplateChange(
                        template.id,
                        "storageClassName",
                        e.target.value
                      )
                    }
                    disabled={!editable}
                    className="h-8 text-sm"
                  />
                </DisabledInputWrapper>
              </div>

              {/* Access Modes */}
              <div className="space-y-2">
                <Label className="text-xs">Access Modes</Label>
                <div className="flex flex-wrap gap-4">
                  {accessModeOptions.map(mode => (
                    <div
                      key={mode.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`${template.id}-${mode.value}`}
                        checked={(template.accessModes || []).includes(
                          mode.value
                        )}
                        onCheckedChange={() =>
                          handleAccessModeToggle(template.id, mode.value)
                        }
                        disabled={!editable}
                      />
                      <Label
                        htmlFor={`${template.id}-${mode.value}`}
                        className="text-xs cursor-pointer"
                        title={mode.description}
                      >
                        {mode.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mount path info */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                Mount path: /data/{template.name || "[name]"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
