import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { PluginNodeData, PluginFieldDefinition } from "@/lib/types/nodes";
import {
  Monitor,
  Network,
  Database,
  HardDrive,
  Activity,
  Shield,
  GitBranch,
  MessageSquare,
  Archive,
  Play,
  Brain,
  TrendingUp,
  Lock,
  LucideIcon,
  Plug,
} from "lucide-react";

// Re-export types for convenience
export type { PluginNodeData, PluginFieldDefinition };

// Map category to icon and colors
const CATEGORY_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  virtualization: {
    icon: Monitor,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  networking: {
    icon: Network,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  database: {
    icon: Database,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
  },
  storage: {
    icon: HardDrive,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  monitoring: {
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  security: {
    icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  workflow: {
    icon: GitBranch,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
  },
  messaging: {
    icon: MessageSquare,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
  },
  backup: {
    icon: Archive,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  cicd: {
    icon: Play,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  ml: {
    icon: Brain,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
  },
  policy: {
    icon: Lock,
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
  },
  scaling: {
    icon: TrendingUp,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10",
  },
};

const GenericPluginNode = memo(
  ({ data, id }: ReactFlowNodeProps<PluginNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handleUpdate = useCallback(
      (field: string, value: string | number | boolean) => {
        updateNodeData(id, { ...data, [field]: value });
      },
      [data, id, updateNodeData]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data);
    }, [id, data, openNodeSettings]);

    // Get category config for styling
    const categoryConfig = CATEGORY_CONFIG[data.pluginCategory] || {
      icon: Plug,
      color: "text-slate-600",
      bgColor: "bg-slate-500/10",
    };

    // Build fields dynamically from plugin field definitions
    const fields: NodeField[] = (data._pluginFields || []).map(
      (fieldDef): NodeField => {
        const baseField: NodeField = {
          id: `${fieldDef.id}-${id}`,
          label: fieldDef.label,
          type: fieldDef.type as "text" | "number" | "select",
          value:
            (data[fieldDef.id] as string | number) || fieldDef.default || "",
          placeholder: fieldDef.placeholder,
          required: fieldDef.required,
          onChange: value => handleUpdate(fieldDef.id, value),
        };

        // Add options for select fields
        if (fieldDef.type === "select" && fieldDef.options) {
          baseField.options = fieldDef.options;
        }

        return baseField;
      }
    );

    // If no fields defined, show a basic name field
    if (fields.length === 0) {
      fields.push({
        id: `name-${id}`,
        label: "Name",
        type: "text",
        value: data.name || "",
        placeholder: "Resource name",
        onChange: value => handleUpdate("name", value),
      });
    }

    return (
      <Node
        title={data.displayName || "Plugin Node"}
        fields={fields}
        onSettingsClick={openSettings}
        disabled={!editable}
        icon={categoryConfig.icon}
        iconColor={categoryConfig.color}
        iconBgColor={categoryConfig.bgColor}
      />
    );
  }
);

GenericPluginNode.displayName = "GenericPluginNode";

export default GenericPluginNode;
