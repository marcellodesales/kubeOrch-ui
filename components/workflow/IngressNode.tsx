import React, { memo, useCallback } from "react";
import { Handle, Position, NodeProps as ReactFlowNodeProps } from "reactflow";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { IngressNodeData, IngressPath } from "@/lib/types/nodes";
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from "@/components/ui/compact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Plus, X } from "lucide-react";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

export type { IngressNodeData };

// Generate a unique ID for new path entries
const generatePathId = () =>
  `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const IngressNode = memo(
  ({ data, id }: ReactFlowNodeProps<IngressNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    // Ensure paths array exists with at least one path
    const paths: IngressPath[] = data.paths?.length
      ? data.paths
      : [{ id: generatePathId(), path: "/", pathType: "Prefix" }];

    const handleHostChange = useCallback(
      (value: string) => {
        updateNodeData(id, {
          ...data,
          host: value,
        } as unknown as WorkflowNodeData);
      },
      [data, id, updateNodeData]
    );

    const handlePathChange = useCallback(
      (pathId: string, field: keyof IngressPath, value: string | number) => {
        const updatedPaths = paths.map(p =>
          p.id === pathId ? { ...p, [field]: value } : p
        );
        updateNodeData(id, {
          ...data,
          paths: updatedPaths,
        } as unknown as WorkflowNodeData);
      },
      [data, id, paths, updateNodeData]
    );

    const handleAddPath = useCallback(() => {
      const newPath: IngressPath = {
        id: generatePathId(),
        path: "/",
        pathType: "Prefix",
      };
      updateNodeData(id, {
        ...data,
        paths: [...paths, newPath],
      } as unknown as WorkflowNodeData);
    }, [data, id, paths, updateNodeData]);

    const handleRemovePath = useCallback(
      (pathId: string) => {
        if (paths.length <= 1) return; // Keep at least one path
        const updatedPaths = paths.filter(p => p.id !== pathId);
        updateNodeData(id, {
          ...data,
          paths: updatedPaths,
        } as unknown as WorkflowNodeData);
      },
      [data, id, paths, updateNodeData]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data as unknown as WorkflowNodeData);
    }, [id, data, openNodeSettings]);

    const cardContent = (
      <CompactCard className="w-[280px] shadow-md border relative">
        <CompactCardHeader className="flex flex-row items-center justify-between relative">
          {/* Left connector - for incoming connections (not path-specific) */}
          <Handle
            type="target"
            position={Position.Left}
            id="main"
            className="w-2 h-2 absolute"
            style={{
              background: "var(--handle-color)",
              left: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />

          <CompactCardTitle>Ingress</CompactCardTitle>

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
          {/* Host field - no connector */}
          <div className="space-y-1">
            <Label
              htmlFor={`host-${id}`}
              className="text-[10px] text-muted-foreground"
            >
              Host
            </Label>
            <Input
              id={`host-${id}`}
              value={data.host || ""}
              placeholder="api.example.com"
              onChange={e => handleHostChange(e.target.value)}
              disabled={!editable}
              className="h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0"
            />
          </div>

          {/* Paths section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Paths</Label>
              {editable && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={handleAddPath}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {paths.map(pathEntry => {
                const isLinked = !!pathEntry._linkedService;

                return (
                  <div
                    key={pathEntry.id}
                    className="relative flex items-center gap-1"
                  >
                    {/* Path input */}
                    <Input
                      value={pathEntry.path || ""}
                      placeholder="/"
                      onChange={e =>
                        handlePathChange(pathEntry.id, "path", e.target.value)
                      }
                      disabled={!editable}
                      className="h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0 flex-1"
                    />

                    {/* Service name (shown only if not linked) */}
                    {!isLinked && (
                      <Input
                        value={pathEntry.serviceName || ""}
                        placeholder="svc"
                        onChange={e =>
                          handlePathChange(
                            pathEntry.id,
                            "serviceName",
                            e.target.value
                          )
                        }
                        disabled={!editable}
                        className="h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0 w-16"
                      />
                    )}

                    {/* Remove button (only if more than one path) */}
                    {paths.length > 1 && editable && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => handleRemovePath(pathEntry.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}

                    {/* Source handle for this specific path - connects to services */}
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={pathEntry.id}
                      className="w-2 h-2 absolute"
                      style={{
                        background: isLinked
                          ? "var(--primary)"
                          : "var(--handle-color)",
                        right: "-20px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 10,
                      }}
                    />
                  </div>
                );
              })}
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

IngressNode.displayName = "IngressNode";

export default IngressNode;
