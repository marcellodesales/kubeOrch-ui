import React, { memo, useCallback, useMemo, useState } from "react";
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
import { Settings, Plus, X, Lock } from "lucide-react";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

export type { SecretNodeData };

const SecretNode = memo(({ data, id }: ReactFlowNodeProps<SecretNodeData>) => {
  const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

  // Local state for secret values (not stored in workflow data)
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});

  // Keys from the workflow data - memoized to avoid dependency issues
  const keys = useMemo(() => data.keys || [], [data.keys]);

  const handleNameChange = useCallback(
    (value: string) => {
      updateNodeData(id, {
        ...data,
        name: value,
      } as unknown as WorkflowNodeData);
    },
    [data, id, updateNodeData]
  );

  const handleAddKey = useCallback(() => {
    const newKey = `SECRET_KEY_${keys.length + 1}`;
    updateNodeData(id, {
      ...data,
      keys: [...keys, newKey],
    } as unknown as WorkflowNodeData);
    setSecretValues(prev => ({ ...prev, [newKey]: "" }));
  }, [data, id, keys, updateNodeData]);

  const handleKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;
      const newKeys = keys.map(k => (k === oldKey ? newKey : k));
      updateNodeData(id, {
        ...data,
        keys: newKeys,
      } as unknown as WorkflowNodeData);
      // Update local values
      setSecretValues(prev => {
        const newValues = { ...prev };
        newValues[newKey] = newValues[oldKey] || "";
        delete newValues[oldKey];
        return newValues;
      });
    },
    [data, id, keys, updateNodeData]
  );

  const handleValueChange = useCallback((key: string, value: string) => {
    setSecretValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleRemoveKey = useCallback(
    (key: string) => {
      const newKeys = keys.filter(k => k !== key);
      updateNodeData(id, {
        ...data,
        keys: newKeys,
      } as unknown as WorkflowNodeData);
      setSecretValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
    },
    [data, id, keys, updateNodeData]
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
          <Lock className="h-3 w-3 text-muted-foreground" />
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
        {/* Name field */}
        <div className="space-y-1">
          <Label
            htmlFor={`name-${id}`}
            className="text-[10px] text-muted-foreground"
          >
            Name
          </Label>
          <Input
            id={`name-${id}`}
            value={data.name || ""}
            placeholder="app-secrets"
            onChange={e => handleNameChange(e.target.value)}
            disabled={!editable}
            className={`h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0 ${
              data.hasValidationError && !data.name ? "border-red-500" : ""
            }`}
          />
        </div>

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
              keys.map(key => (
                <div key={key} className="flex items-center gap-1">
                  <Input
                    value={key}
                    placeholder="KEY"
                    onChange={e => handleKeyChange(key, e.target.value)}
                    disabled={!editable}
                    className="h-6 text-xs rounded-sm py-0.5 w-24 flex-shrink-0"
                  />
                  <Input
                    type="password"
                    value={secretValues[key] || ""}
                    placeholder="value"
                    onChange={e => handleValueChange(key, e.target.value)}
                    disabled={!editable}
                    className="h-6 text-xs rounded-sm py-0.5 flex-1"
                  />
                  {editable && (
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

        {/* Info note */}
        <div className="text-[9px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
          Values are sent directly to K8s. Only key names are stored.
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
