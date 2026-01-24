import React, { memo, useCallback } from "react";
import { Handle, Position, NodeProps as ReactFlowNodeProps } from "reactflow";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { PersistentVolumeClaimNodeData } from "@/lib/types/nodes";
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from "@/components/ui/compact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, HardDrive, ChevronDown } from "lucide-react";
import { DisabledInputWrapper } from "@/components/ui/disabled-input-wrapper";

type AccessMode =
  | "ReadWriteOnce"
  | "ReadOnlyMany"
  | "ReadWriteMany"
  | "ReadWriteOncePod";

const ACCESS_MODE_OPTIONS: { value: AccessMode; label: string }[] = [
  { value: "ReadWriteOnce", label: "RWO" },
  { value: "ReadOnlyMany", label: "ROX" },
  { value: "ReadWriteMany", label: "RWX" },
  { value: "ReadWriteOncePod", label: "RWOP" },
];

export type { PersistentVolumeClaimNodeData };

const PersistentVolumeClaimNode = memo(
  ({ data, id }: ReactFlowNodeProps<PersistentVolumeClaimNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handleStorageChange = useCallback(
      (value: string) => {
        updateNodeData(id, {
          ...data,
          storage: value,
        } as unknown as WorkflowNodeData);
      },
      [data, id, updateNodeData]
    );

    const handleAccessModeToggle = useCallback(
      (mode: AccessMode, checked: boolean) => {
        const currentModes = data.accessModes || [];
        let newModes: AccessMode[];

        if (checked) {
          newModes = [...currentModes, mode];
        } else {
          newModes = currentModes.filter(m => m !== mode);
          if (newModes.length === 0) {
            newModes = ["ReadWriteOnce"];
          }
        }

        updateNodeData(id, {
          ...data,
          accessModes: newModes,
        } as unknown as WorkflowNodeData);
      },
      [data, id, updateNodeData]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data as unknown as WorkflowNodeData);
    }, [id, data, openNodeSettings]);

    const selectedModes = data.accessModes || ["ReadWriteOnce"];
    const displayText = selectedModes
      .map(mode => ACCESS_MODE_OPTIONS.find(o => o.value === mode)?.label)
      .filter(Boolean)
      .join(", ");

    const cardContent = (
      <CompactCard className="w-[260px] shadow-md border relative">
        <CompactCardHeader className="flex flex-row items-center justify-between relative">
          {/* Right connector - outputs to Deployment/StatefulSet */}
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
            <div className="p-1 rounded bg-emerald-500/10">
              <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <CompactCardTitle>PersistentVolumeClaim</CompactCardTitle>
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

        <CompactCardContent className="space-y-2.5">
          {/* Storage Size and Access Mode in a row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Storage *
              </Label>
              <Input
                value={data.storage || ""}
                placeholder="10Gi"
                onChange={e => handleStorageChange(e.target.value)}
                disabled={!editable}
                className={`h-7 text-xs rounded-sm py-0.5 leading-normal focus-visible:ring-0 focus-visible:ring-offset-0 ${
                  data.hasValidationError && !data.storage
                    ? "border-red-500"
                    : ""
                }`}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Access Mode
              </Label>
              <Popover>
                <PopoverTrigger asChild disabled={!editable}>
                  <Button
                    variant="outline"
                    className="!h-7 w-full justify-between text-xs rounded-sm !py-0.5 px-2 font-normal"
                    disabled={!editable}
                  >
                    <span className="truncate">{displayText}</span>
                    <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-36 p-2" align="start">
                  <div className="space-y-2">
                    {ACCESS_MODE_OPTIONS.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedModes.includes(option.value)}
                          onCheckedChange={checked =>
                            handleAccessModeToggle(option.value, !!checked)
                          }
                        />
                        <span className="text-xs">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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

PersistentVolumeClaimNode.displayName = "PersistentVolumeClaimNode";

export default PersistentVolumeClaimNode;
