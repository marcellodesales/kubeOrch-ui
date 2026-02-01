import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { CronJobNodeData } from "@/lib/types/nodes";
import { Clock } from "lucide-react";

export type { CronJobNodeData };

const CronJobNode = memo(
  ({ data, id }: ReactFlowNodeProps<CronJobNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handleUpdate = useCallback(
      (field: string, value: string | number | boolean) => {
        const paths = field.split(".");
        const updatedData = { ...data };
        let current: Record<string, unknown> = updatedData as Record<
          string,
          unknown
        >;

        for (let i = 0; i < paths.length - 1; i++) {
          if (!current[paths[i]]) {
            current[paths[i]] = {};
          }
          current = current[paths[i]] as Record<string, unknown>;
        }

        current[paths[paths.length - 1]] = value;
        updateNodeData(id, updatedData);
      },
      [data, id, updateNodeData]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data);
    }, [id, data, openNodeSettings]);

    const fields: NodeField[] = [
      {
        id: `schedule-${id}`,
        label: "Schedule (Cron)",
        type: "text",
        value: data.schedule || "",
        placeholder: "0 2 * * *",
        hasError: data.hasValidationError && !data.schedule,
        onChange: value => handleUpdate("schedule", value),
      },
      {
        id: `image-${id}`,
        label: "Docker Image",
        type: "text",
        value: data.image || "",
        placeholder: "backup-tool:latest",
        hasError: data.hasValidationError && !data.image,
        onChange: value => handleUpdate("image", value),
      },
      {
        id: `concurrencyPolicy-${id}`,
        label: "Concurrency",
        type: "select",
        value: data.concurrencyPolicy || "Allow",
        options: [
          { value: "Allow", label: "Allow" },
          { value: "Forbid", label: "Forbid" },
          { value: "Replace", label: "Replace" },
        ],
        onChange: value => handleUpdate("concurrencyPolicy", value),
      },
    ];

    return (
      <Node
        title="CronJob"
        fields={fields}
        onSettingsClick={openSettings}
        disabled={!editable}
        icon={Clock}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-500/10"
      />
    );
  }
);

CronJobNode.displayName = "CronJobNode";

export default CronJobNode;
