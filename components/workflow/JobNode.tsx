import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { JobNodeData } from "@/lib/types/nodes";
import { PlayCircle } from "lucide-react";

export type { JobNodeData };

const JobNode = memo(({ data, id }: ReactFlowNodeProps<JobNodeData>) => {
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
      id: `image-${id}`,
      label: "Docker Image",
      type: "text",
      value: data.image || "",
      placeholder: "postgres:15",
      hasError: data.hasValidationError && !data.image,
      onChange: value => handleUpdate("image", value),
    },
    {
      id: `group-${id}`,
      label: "",
      type: "group",
      fields: [
        {
          id: `completions-${id}`,
          label: "Completions",
          type: "number",
          value: data.completions ?? 1,
          placeholder: "1",
          min: 1,
          required: false,
          onChange: value => handleUpdate("completions", value),
        },
        {
          id: `parallelism-${id}`,
          label: "Parallelism",
          type: "number",
          value: data.parallelism ?? 1,
          placeholder: "1",
          min: 1,
          required: false,
          onChange: value => handleUpdate("parallelism", value),
        },
      ],
    },
  ];

  return (
    <Node
      title="Job"
      fields={fields}
      onSettingsClick={openSettings}
      disabled={!editable}
      icon={PlayCircle}
      iconColor="text-amber-600"
      iconBgColor="bg-amber-500/10"
    />
  );
});

JobNode.displayName = "JobNode";

export default JobNode;
