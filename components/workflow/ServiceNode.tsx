import React, { memo, useCallback } from "react";
import { Handle, Position, NodeProps as ReactFlowNodeProps } from "reactflow";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { ServiceNodeData } from "@/lib/types/nodes";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

export type { ServiceNodeData };

const ServiceNode = memo(
  ({ data, id }: ReactFlowNodeProps<ServiceNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handleUpdate = useCallback(
      (field: string, value: string | number | boolean) => {
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

    // Check if Service is linked to a Deployment via edge
    const isLinkedToDeployment = !!data._linkedDeployment;

    const cardContent = (
      <CompactCard className="w-[280px] shadow-md border relative">
        <CompactCardHeader className="flex flex-row items-center justify-between relative">
          {/* Left connector - receives from Ingress */}
          <Handle
            type="target"
            position={Position.Left}
            id="input"
            className="w-2 h-2 absolute"
            style={{
              background: "var(--handle-color)",
              left: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />

          {/* Right connector - outputs to Deployment */}
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            className="w-2 h-2 absolute"
            style={{
              background: isLinkedToDeployment
                ? "var(--primary)"
                : "var(--handle-color)",
              right: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
          />

          <CompactCardTitle>Service</CompactCardTitle>

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
          {/* Target App field - completely hidden when linked via edge */}
          {!isLinkedToDeployment && (
            <div className="space-y-1">
              <Label
                htmlFor={`targetApp-${id}`}
                className="text-[10px] text-muted-foreground"
              >
                Target App
              </Label>
              <Input
                id={`targetApp-${id}`}
                value={data.targetApp || ""}
                placeholder="my-app"
                onChange={e => handleUpdate("targetApp", e.target.value)}
                disabled={!editable}
                className={`h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0 ${
                  data.hasValidationError && !data.targetApp
                    ? "border-red-500"
                    : ""
                }`}
              />
            </div>
          )}

          {/* Type and Port in a row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label
                htmlFor={`serviceType-${id}`}
                className="text-[10px] text-muted-foreground"
              >
                Type
              </Label>
              <Select
                value={data.serviceType || "ClusterIP"}
                onValueChange={value => handleUpdate("serviceType", value)}
                disabled={!editable}
              >
                <SelectTrigger
                  className="!h-7 w-full min-w-0 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0"
                  disabled={!editable}
                >
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ClusterIP">ClusterIP</SelectItem>
                  <SelectItem value="NodePort">NodePort</SelectItem>
                  <SelectItem value="LoadBalancer">LB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor={`port-${id}`}
                className="text-[10px] text-muted-foreground"
              >
                Port
              </Label>
              <Input
                id={`port-${id}`}
                type="number"
                min={1}
                max={65535}
                value={data.port ?? 80}
                placeholder="80"
                onChange={e => handleUpdate("port", parseInt(e.target.value))}
                disabled={!editable}
                className="h-7 text-sm rounded-sm py-1 focus:ring-1 focus:ring-offset-0"
              />
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

ServiceNode.displayName = "ServiceNode";

export default ServiceNode;
