import React, { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus, X, Variable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DeploymentNodeData,
  StatefulSetNodeData,
  EnvVarEntry,
} from "@/lib/types/nodes";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";

// Generate a stable unique ID for a key entry
const generateKeyId = () => `env_${uuidv4()}`;

interface EnvVarsEditorProps {
  data: DeploymentNodeData | StatefulSetNodeData;
  nodeId: string;
  editable: boolean;
}

export function EnvVarsEditor({ data, nodeId, editable }: EnvVarsEditorProps) {
  const {
    updateNodeData,
    envValues: allEnvValues,
    setEnvValue,
    removeEnvKey,
  } = useWorkflowStore();
  const keys = useMemo(() => data.envKeys || [], [data.envKeys]);

  // Get env values for this node from store (not stored in DB)
  const envValues = allEnvValues[nodeId] || {};

  // Check if Secret is attached (checked here to follow React hooks rules)
  const hasLinkedSecrets = (data._linkedSecrets?.length ?? 0) > 0;

  const handleKeyNameChange = useCallback(
    (entryId: string, newName: string) => {
      const newKeys = keys.map(entry =>
        entry.id === entryId ? { ...entry, name: newName } : entry
      );
      updateNodeData(nodeId, {
        ...data,
        envKeys: newKeys,
      } as unknown as WorkflowNodeData);
    },
    [data, keys, nodeId, updateNodeData]
  );

  const handleValueChange = useCallback(
    (entryId: string, value: string) => {
      setEnvValue(nodeId, entryId, value);
    },
    [nodeId, setEnvValue]
  );

  const handleAddKey = useCallback(() => {
    const newEntry: EnvVarEntry = {
      id: generateKeyId(),
      name: "",
    };
    updateNodeData(nodeId, {
      ...data,
      envKeys: [...keys, newEntry],
    } as unknown as WorkflowNodeData);
    // Initialize empty value in store
    setEnvValue(nodeId, newEntry.id, "");
  }, [data, keys, nodeId, updateNodeData, setEnvValue]);

  const handleRemoveKey = useCallback(
    (entryId: string) => {
      const newKeys = keys.filter(entry => entry.id !== entryId);
      updateNodeData(nodeId, {
        ...data,
        envKeys: newKeys,
      } as unknown as WorkflowNodeData);
      removeEnvKey(nodeId, entryId);
    },
    [data, keys, nodeId, updateNodeData, removeEnvKey]
  );

  // Don't show env vars editor if a Secret is attached (use Secret for env vars instead)
  if (hasLinkedSecrets) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Environment Variables</h3>
        </div>
        {editable && (
          <Button size="sm" variant="outline" onClick={handleAddKey}>
            <Plus className="h-3 w-3 mr-1" />
            Add Variable
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
            No environment variables. Click &quot;Add Variable&quot; to create
            one.
          </div>
        ) : (
          keys.map(entry => (
            <div key={entry.id} className="p-3 border rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground w-12">
                  Name
                </Label>
                <Input
                  value={entry.name}
                  placeholder="ENV_VAR_NAME"
                  onChange={e => handleKeyNameChange(entry.id, e.target.value)}
                  disabled={!editable}
                  className="h-8 text-sm font-mono"
                />
                {editable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleRemoveKey(entry.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground w-12">
                  Value
                </Label>
                <Input
                  value={envValues[entry.id] || ""}
                  placeholder="Enter value..."
                  onChange={e => handleValueChange(entry.id, e.target.value)}
                  disabled={!editable}
                  className="h-8 text-sm font-mono"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
