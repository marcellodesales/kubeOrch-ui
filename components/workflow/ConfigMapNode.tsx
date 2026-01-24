import React, { memo, useCallback, useMemo } from "react";
import { Handle, Position, NodeProps as ReactFlowNodeProps } from "reactflow";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { ConfigMapNodeData } from "@/lib/types/nodes";
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from "@/components/ui/compact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Plus, X, FileSliders } from "lucide-react";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

export type { ConfigMapNodeData };

const ConfigMapNode = memo(
  ({ data, id }: ReactFlowNodeProps<ConfigMapNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    // Ensure data.data exists - memoized to avoid dependency issues
    const configData = useMemo(() => data.data || {}, [data.data]);
    const entries = Object.entries(configData);

    const handleKeyChange = useCallback(
      (oldKey: string, newKey: string) => {
        if (oldKey === newKey) return;
        const newData = { ...configData };
        const value = newData[oldKey];
        delete newData[oldKey];
        newData[newKey] = value;
        updateNodeData(id, {
          ...data,
          data: newData,
        } as unknown as WorkflowNodeData);
      },
      [configData, data, id, updateNodeData]
    );

    const handleValueChange = useCallback(
      (key: string, value: string) => {
        updateNodeData(id, {
          ...data,
          data: {
            ...configData,
            [key]: value,
          },
        } as unknown as WorkflowNodeData);
      },
      [configData, data, id, updateNodeData]
    );

    const handleAddEntry = useCallback(() => {
      // Generate a unique temporary key to avoid collisions
      const tempKey = `_new_${Date.now()}`;
      updateNodeData(id, {
        ...data,
        data: {
          ...configData,
          [tempKey]: "",
        },
      } as unknown as WorkflowNodeData);
    }, [configData, data, id, updateNodeData]);

    const handleRemoveEntry = useCallback(
      (key: string) => {
        // Prevent removing the last entry - must have at least 1
        if (Object.keys(configData).length <= 1) return;
        const newData = { ...configData };
        delete newData[key];
        updateNodeData(id, {
          ...data,
          data: newData,
        } as unknown as WorkflowNodeData);
      },
      [configData, data, id, updateNodeData]
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
            <div className="p-1 rounded bg-slate-500/10">
              <FileSliders className="h-3.5 w-3.5 text-slate-600" />
            </div>
            <CompactCardTitle>ConfigMap</CompactCardTitle>
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
          {/* Key-Value entries */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Data</Label>
              {editable && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={handleAddEntry}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {entries.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic">
                  No entries. Click + to add.
                </p>
              ) : (
                entries.map(([key, value], index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Input
                      value={key.startsWith("_new_") ? "" : key}
                      placeholder="KEY"
                      onChange={e => handleKeyChange(key, e.target.value)}
                      disabled={!editable}
                      className="h-6 text-xs rounded-sm py-0.5 w-20 flex-shrink-0 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <span className="text-muted-foreground text-xs">=</span>
                    <Input
                      value={value}
                      placeholder="value"
                      onChange={e => handleValueChange(key, e.target.value)}
                      disabled={!editable}
                      className="h-6 text-xs rounded-sm py-0.5 flex-1 min-h-[24px] leading-normal focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {editable && entries.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-0 shrink-0"
                        onClick={() => handleRemoveEntry(key)}
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
  }
);

ConfigMapNode.displayName = "ConfigMapNode";

export default ConfigMapNode;
