import React, { memo, useCallback, useMemo } from "react";
import { Handle, Position, NodeProps as ReactFlowNodeProps } from "reactflow";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { SecretNodeData } from "@/lib/types/nodes";
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

const SecretNode = memo(({ data, id }: ReactFlowNodeProps<SecretNodeData>) => {
  const {
    updateNodeData,
    openNodeSettings,
    editable,
    secretValues: allSecretValues,
    setSecretValue,
    renameSecretKey,
    removeSecretKey,
  } = useWorkflowStore();

  // Get secret values for this node from store (not stored in DB)
  const secretValues = allSecretValues[id] || {};

  // Keys from the workflow data - memoized to avoid dependency issues
  const keys = useMemo(() => data.keys || [], [data.keys]);

  const handleAddKey = useCallback(() => {
    // Generate a unique temporary key to avoid collisions
    const tempKey = `_new_${Date.now()}`;
    updateNodeData(id, {
      ...data,
      keys: [...keys, tempKey],
    } as unknown as WorkflowNodeData);
    setSecretValue(id, tempKey, "");
  }, [data, id, keys, updateNodeData, setSecretValue]);

  const handleKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;
      const newKeys = keys.map(k => (k === oldKey ? newKey : k));
      updateNodeData(id, {
        ...data,
        keys: newKeys,
      } as unknown as WorkflowNodeData);
      // Update secret values in store
      renameSecretKey(id, oldKey, newKey);
    },
    [data, id, keys, updateNodeData, renameSecretKey]
  );

  const handleValueChange = useCallback(
    (key: string, value: string) => {
      setSecretValue(id, key, value);
    },
    [id, setSecretValue]
  );

  const handleRemoveKey = useCallback(
    (key: string) => {
      // Prevent removing the last key - must have at least 1
      if (keys.length <= 1) return;
      const newKeys = keys.filter(k => k !== key);
      updateNodeData(id, {
        ...data,
        keys: newKeys,
      } as unknown as WorkflowNodeData);
      removeSecretKey(id, key);
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

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="h-3 w-3 text-muted-foreground cursor-help" />
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
              keys.map((key, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Input
                    value={key.startsWith("_new_") ? "" : key}
                    placeholder="KEY"
                    onChange={e => handleKeyChange(key, e.target.value)}
                    disabled={!editable}
                    className="h-6 text-xs rounded-sm py-0.5 w-24 flex-shrink-0 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Input
                    type="password"
                    value={secretValues[key] || ""}
                    placeholder="value"
                    onChange={e => handleValueChange(key, e.target.value)}
                    disabled={!editable}
                    className="h-6 text-xs rounded-sm py-0.5 flex-1 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {editable && keys.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 p-0 shrink-0"
                      onClick={() => handleRemoveKey(key)}
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
