import React, { memo, useCallback, useMemo } from "react";
import { Handle, Position, NodeProps as ReactFlowNodeProps } from "reactflow";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { SecretNodeData, SecretKeyEntry } from "@/lib/types/nodes";
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from "@/components/ui/compact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, Plus, X, Lock } from "lucide-react";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

export type { SecretNodeData };

// Generate a stable unique ID for a key entry
const generateKeyId = () =>
  `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const SecretNode = memo(({ data, id }: ReactFlowNodeProps<SecretNodeData>) => {
  const {
    updateNodeData,
    openNodeSettings,
    editable,
    secretValues: allSecretValues,
    setSecretValue,
    removeSecretKey,
  } = useWorkflowStore();

  // Get secret values for this node from store (not stored in DB)
  const secretValues = allSecretValues[id] || {};

  // Keys from the workflow data - memoized to avoid dependency issues
  const keys = useMemo(() => data.keys || [], [data.keys]);

  const handleAddKey = useCallback(() => {
    const newEntry: SecretKeyEntry = {
      id: generateKeyId(),
      name: "", // Start with empty name
    };
    updateNodeData(id, {
      ...data,
      keys: [...keys, newEntry],
    } as unknown as WorkflowNodeData);
    // Initialize empty value in store (keyed by entry.id)
    setSecretValue(id, newEntry.id, "");
  }, [data, id, keys, updateNodeData, setSecretValue]);

  const handleKeyNameChange = useCallback(
    (entryId: string, newName: string) => {
      const newKeys = keys.map(entry =>
        entry.id === entryId ? { ...entry, name: newName } : entry
      );
      updateNodeData(id, {
        ...data,
        keys: newKeys,
      } as unknown as WorkflowNodeData);
      // No need to rename in store since we key by entry.id, not name
    },
    [data, id, keys, updateNodeData]
  );

  const handleValueChange = useCallback(
    (entryId: string, value: string) => {
      setSecretValue(id, entryId, value);
    },
    [id, setSecretValue]
  );

  const handleRemoveKey = useCallback(
    (entryId: string) => {
      // Prevent removing the last key - must have at least 1
      if (keys.length <= 1) return;
      const newKeys = keys.filter(entry => entry.id !== entryId);
      updateNodeData(id, {
        ...data,
        keys: newKeys,
      } as unknown as WorkflowNodeData);
      removeSecretKey(id, entryId);
    },
    [data, id, keys, updateNodeData, removeSecretKey]
  );

  const openSettings = useCallback(() => {
    openNodeSettings(id, data as unknown as WorkflowNodeData);
  }, [id, data, openNodeSettings]);

  const cardContent = (
    <CompactCard className="w-[280px] shadow-md border relative">
      <CompactCardHeader className="flex flex-row items-center justify-between relative">
        {/* Right connector - outputs to Deployment */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="w-2 h-2 absolute"
          style={{
            background: "var(--handle-color)",
            right: "-12px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
        />

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-1 rounded bg-amber-500/10 cursor-help">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              Values are sent directly to K8s. Only key names are stored.
            </TooltipContent>
          </Tooltip>
          <CompactCardTitle>Secret</CompactCardTitle>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={openSettings}
        >
          <Settings className="h-3 w-3" />
        </Button>
      </CompactCardHeader>

      <CompactCardContent className="space-y-2">
        {/* Secret key entries */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground">Keys</Label>
            {editable && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={handleAddKey}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="space-y-1 max-h-[100px] overflow-y-auto">
            {keys.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">
                No keys. Click + to add.
              </p>
            ) : (
              keys.map(entry => (
                <div key={entry.id} className="flex items-center gap-1">
                  <Input
                    value={entry.name}
                    placeholder="KEY"
                    onChange={e =>
                      handleKeyNameChange(entry.id, e.target.value)
                    }
                    disabled={!editable}
                    className="h-6 text-xs rounded-sm py-0.5 w-24 flex-shrink-0 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Input
                    type="password"
                    value={secretValues[entry.id] || ""}
                    placeholder="value"
                    onChange={e => handleValueChange(entry.id, e.target.value)}
                    disabled={!editable}
                    className="h-6 text-xs rounded-sm py-0.5 flex-1 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {editable && keys.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 p-0 shrink-0"
                      onClick={() => handleRemoveKey(entry.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CompactCardContent>
    </CompactCard>
  );

  return (
    <DisabledInputWrapper disabled={!editable}>
      {cardContent}
    </DisabledInputWrapper>
  );
});

SecretNode.displayName = "SecretNode";

export default SecretNode;
