import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { HPANodeData } from "@/lib/types/nodes";
import { TrendingUp } from "lucide-react";

export type { HPANodeData };

const HPANode = memo(({ data, id }: ReactFlowNodeProps<HPANodeData>) => {
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
    ...(!data._linkedTarget
      ? [
          {
            id: `scaleTargetName-${id}`,
            label: "Target Workload",
            type: "text" as const,
            value: data.scaleTargetName || "",
            placeholder: "my-deployment",
            hasError: data.hasValidationError && !data.scaleTargetName,
            onChange: (value: string | number | boolean) =>
              handleUpdate("scaleTargetName", value),
          },
        ]
      : []),
    {
      id: `replicas-group-${id}`,
      label: "",
      type: "group",
      fields: [
        {
          id: `minReplicas-${id}`,
          label: "Min Replicas",
          type: "number",
          value: data.minReplicas ?? 1,
          placeholder: "1",
          min: 1,
          required: true,
          onChange: value => handleUpdate("minReplicas", value),
        },
        {
          id: `maxReplicas-${id}`,
          label: "Max Replicas",
          type: "number",
          value: data.maxReplicas ?? 10,
          placeholder: "10",
          min: 1,
          required: true,
          hasError: data.hasValidationError && !data.maxReplicas,
          onChange: value => handleUpdate("maxReplicas", value),
        },
      ],
    },
    {
      id: `cpu-group-${id}`,
      label: "",
      type: "group",
      fields: [
        {
          id: `targetCPUUtilization-${id}`,
          label: "CPU Target %",
          type: "number",
          value: data.targetCPUUtilization ?? 80,
          placeholder: "80",
          min: 1,
          max: 100,
          onChange: value => handleUpdate("targetCPUUtilization", value),
        },
        {
          id: `targetMemoryUtilization-${id}`,
          label: "Memory %",
          type: "number",
          value: data.targetMemoryUtilization,
          placeholder: "-",
          min: 1,
          max: 100,
          onChange: value => handleUpdate("targetMemoryUtilization", value),
        },
      ],
    },
  ];

  return (
    <Node
      title="HPA"
      fields={fields}
      onSettingsClick={openSettings}
      disabled={!editable}
      icon={TrendingUp}
      iconColor="text-green-600"
      iconBgColor="bg-green-500/10"
      hideTargetHandle
      singleSourceHandle
    />
  );
});

HPANode.displayName = "HPANode";

export default HPANode;
