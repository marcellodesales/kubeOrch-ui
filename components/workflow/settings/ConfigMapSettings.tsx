import React, { useCallback, useMemo } from "react";
import { CheckCircle2, AlertCircle, Plus, X, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { ConfigMapNodeData } from "@/lib/types/nodes";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";

// Status renderer for ConfigMap nodes
function ConfigMapStatus({ data }: { data: ConfigMapNodeData }) {
  if (!data._status) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge
          variant={
            data._status.state === "created"
              ? "default"
              : data._status.state === "error"
                ? "destructive"
                : "secondary"
          }
          className="flex items-center gap-1"
        >
          {data._status.state === "created" && (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {data._status.state === "error" && (
            <AlertCircle className="h-3 w-3" />
          )}
          {data._status.state || "Pending"}
        </Badge>
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

// Data editor component for key-value pairs with larger text areas
function ConfigMapDataEditor({
  data,
  nodeId,
  editable,
}: {
  data: ConfigMapNodeData;
  nodeId: string;
  editable: boolean;
}) {
  const { updateNodeData } = useWorkflowStore();
  const configData = useMemo(() => data.data || {}, [data.data]);
  const entries = Object.entries(configData);

  const handleKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;
      const newData = { ...configData };
      const value = newData[oldKey];
      delete newData[oldKey];
      newData[newKey] = value;
      updateNodeData(nodeId, {
        ...data,
        data: newData,
      } as unknown as WorkflowNodeData);
    },
    [configData, data, nodeId, updateNodeData]
  );

  const handleValueChange = useCallback(
    (key: string, value: string) => {
      updateNodeData(nodeId, {
        ...data,
        data: {
          ...configData,
          [key]: value,
        },
      } as unknown as WorkflowNodeData);
    },
    [configData, data, nodeId, updateNodeData]
  );

  const handleAddEntry = useCallback(() => {
    // Generate a unique temporary key to avoid collisions
    const tempKey = `_new_${Date.now()}`;
    updateNodeData(nodeId, {
      ...data,
      data: {
        ...configData,
        [tempKey]: "",
      },
    } as unknown as WorkflowNodeData);
  }, [configData, data, nodeId, updateNodeData]);

  const handleRemoveEntry = useCallback(
    (key: string) => {
      // Prevent removing the last entry - must have at least 1
      if (Object.keys(configData).length <= 1) return;
      const newData = { ...configData };
      delete newData[key];
      updateNodeData(nodeId, {
        ...data,
        data: newData,
      } as unknown as WorkflowNodeData);
    },
    [configData, data, nodeId, updateNodeData]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Configuration Data</h3>
        </div>
        {editable && (
          <Button size="sm" variant="outline" onClick={handleAddEntry}>
            <Plus className="h-3 w-3 mr-1" />
            Add Entry
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Add key-value pairs that will be available as files in the mounted
        directory.
      </p>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
            No configuration entries. Click &quot;Add Entry&quot; to create one.
          </div>
        ) : (
          entries.map(([key, value], index) => (
            <div key={index} className="space-y-2 p-3 border rounded-md">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground w-12">
                  Key
                </Label>
                <Input
                  value={key.startsWith("_new_") ? "" : key}
                  placeholder="CONFIG_KEY"
                  onChange={e => handleKeyChange(key, e.target.value)}
                  disabled={!editable}
                  className="h-8 text-sm font-mono"
                />
                {editable && entries.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleRemoveEntry(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Label className="text-xs text-muted-foreground w-12 pt-2">
                  Value
                </Label>
                <Textarea
                  value={value}
                  placeholder="Configuration value..."
                  onChange={e => handleValueChange(key, e.target.value)}
                  disabled={!editable}
                  className="text-sm font-mono min-h-[60px] flex-1"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const configMapSettingsConfig: NodeSettingsConfig = {
  title: "ConfigMap Settings",
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
          id: "mountPath",
          label: "Mount Path",
          type: "text",
          field: "mountPath",
          placeholder: "/etc/config",
          description:
            "Directory path where ConfigMap will be mounted in containers",
        },
      ],
    },
  ],
  statusRenderer: data => <ConfigMapStatus data={data as ConfigMapNodeData} />,
  extraContent: (data, { nodeId, editable }) => (
    <ConfigMapDataEditor
      data={data as ConfigMapNodeData}
      nodeId={nodeId}
      editable={editable}
    />
  ),
};
