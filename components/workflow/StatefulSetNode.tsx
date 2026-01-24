import React, { memo, useCallback } from "react";
import { Handle, Position, NodeProps as ReactFlowNodeProps } from "reactflow";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { StatefulSetNodeData } from "@/lib/types/nodes";
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from "@/components/ui/compact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Database } from "lucide-react";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

export type { StatefulSetNodeData };

const StatefulSetNode = memo(
  ({ data, id }: ReactFlowNodeProps<StatefulSetNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handleUpdate = useCallback(
      (field: string, value: string | number) => {
        updateNodeData(id, {
          ...data,
          [field]: value,
        } as unknown as WorkflowNodeData);
      },
      [data, id, updateNodeData]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data as unknown as WorkflowNodeData);
    }, [id, data, openNodeSettings]);

    const cardContent = (
      <CompactCard className="w-[280px] shadow-md border relative">
        <CompactCardHeader className="flex flex-row items-center justify-between relative">
          {/* Left connector - receives from ConfigMap/Secret/PVC */}
          <Handle
            type="target"
            position={Position.Left}
            className="w-2 h-2 absolute"
            style={{
              background: "var(--handle-color)",
              left: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />

          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-violet-500/10">
              <Database className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <CompactCardTitle>StatefulSet</CompactCardTitle>
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

        <CompactCardContent className="space-y-2.5 relative">
          {/* Docker Image */}
          <div className="space-y-1 relative">
            <Label className="text-[10px] text-muted-foreground">
              Docker Image *
            </Label>
            <Input
              value={data.image || ""}
              placeholder="postgres:18"
              onChange={e => handleUpdate("image", e.target.value)}
              disabled={!editable}
              className={`h-7 text-xs rounded-sm py-0.5 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0 ${
                data.hasValidationError && !data.image ? "border-red-500" : ""
              }`}
            />
            {/* Source handle for Service connection */}
            <Handle
              type="source"
              position={Position.Right}
              id="image"
              className="w-2 h-2 absolute"
              style={{
                background: "var(--handle-color)",
                right: "-20px",
                top: "0px",
                zIndex: 10,
              }}
            />
          </div>

          {/* Replicas and Port in a row */}
          <div className="grid grid-cols-2 gap-2 relative">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Replicas
              </Label>
              <Input
                type="number"
                min={0}
                value={
                  data.replicas === undefined || isNaN(data.replicas)
                    ? ""
                    : data.replicas
                }
                placeholder="1"
                onChange={e =>
                  handleUpdate("replicas", parseInt(e.target.value))
                }
                disabled={!editable}
                className="h-7 text-xs rounded-sm py-0.5 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Port</Label>
              <Input
                type="number"
                min={1}
                max={65535}
                value={
                  data.port === undefined || isNaN(data.port) ? "" : data.port
                }
                placeholder="5432"
                onChange={e => handleUpdate("port", parseInt(e.target.value))}
                disabled={!editable}
                className="h-7 text-xs rounded-sm py-0.5 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            {/* Source handle at group level */}
            <Handle
              type="source"
              position={Position.Right}
              id="group"
              className="w-2 h-2 absolute"
              style={{
                background: "var(--handle-color)",
                right: "-20px",
                top: "12px",
                zIndex: 10,
              }}
            />
          </div>

          {/* Volume claim templates indicator */}
          {data.volumeClaimTemplates &&
            data.volumeClaimTemplates.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {data.volumeClaimTemplates.length} volume template
                {data.volumeClaimTemplates.length > 1 ? "s" : ""}
              </div>
            )}
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

StatefulSetNode.displayName = "StatefulSetNode";

export default StatefulSetNode;
