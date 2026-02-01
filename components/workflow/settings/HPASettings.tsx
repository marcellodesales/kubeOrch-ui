import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { HPANodeData } from "@/lib/types/nodes";

// Status renderer for HPA nodes
function HPAStatus({ data }: { data: HPANodeData; editable: boolean }) {
  if (!data._status) return null;

  const getStatusIcon = () => {
    const current = data._status?.currentReplicas ?? 0;
    const desired = data._status?.desiredReplicas ?? 0;
    if (current < desired) return <TrendingUp className="h-3 w-3" />;
    if (current > desired) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getStatusVariant = () => {
    switch (data._status?.state) {
      case "stable":
        return "default";
      case "scaling":
        return "secondary";
      case "limited":
        return "outline";
      default:
        return "destructive";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge variant={getStatusVariant()} className="flex items-center gap-1">
          {getStatusIcon()}
          {data._status.state || "unknown"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Replicas</div>
          <div className="font-medium">
            {data._status.currentReplicas ?? "-"} /{" "}
            {data._status.desiredReplicas ?? "-"}
          </div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Range</div>
          <div className="font-medium">
            {data.minReplicas ?? 1} - {data.maxReplicas ?? "-"}
          </div>
        </div>
        {data._status.currentCPU !== undefined && (
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">CPU</div>
            <div className="font-medium">
              {data._status.currentCPU}% / {data.targetCPUUtilization ?? "-"}%
            </div>
          </div>
        )}
        {data._status.currentMemory !== undefined && (
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Memory</div>
            <div className="font-medium">
              {data._status.currentMemory}% /{" "}
              {data.targetMemoryUtilization ?? "-"}%
            </div>
          </div>
        )}
      </div>

      {data._status.message && (
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-xs">{data._status.message}</p>
        </div>
      )}
    </div>
  );
}

export const hpaSettingsConfig: NodeSettingsConfig = {
  title: "HPA Settings",
  sections: [
    {
      id: "basic",
      title: "Basic Configuration",
      fields: [
        {
          id: "namespace",
          label: "Namespace",
          type: "text",
          field: "namespace",
          placeholder: "default",
        },
        {
          id: "target-group",
          type: "group",
          fields: [
            {
              id: "scaleTargetKind",
              label: "Target Kind",
              type: "select",
              field: "scaleTargetKind",
              options: [
                { value: "Deployment", label: "Deployment" },
                { value: "StatefulSet", label: "StatefulSet" },
              ],
            },
            {
              id: "scaleTargetName",
              label: "Target Name *",
              type: "text",
              field: "scaleTargetName",
              placeholder: "my-deployment",
              required: true,
            },
          ],
        },
      ],
    },
    {
      id: "replicas",
      title: "Replica Bounds",
      fields: [
        {
          id: "replicas-group",
          type: "group",
          fields: [
            {
              id: "minReplicas",
              label: "Min Replicas *",
              type: "number",
              field: "minReplicas",
              placeholder: "1",
              min: 1,
              required: true,
            },
            {
              id: "maxReplicas",
              label: "Max Replicas *",
              type: "number",
              field: "maxReplicas",
              placeholder: "10",
              min: 1,
              required: true,
            },
          ],
        },
      ],
    },
    {
      id: "metrics",
      title: "Target Metrics",
      fields: [
        {
          id: "metrics-group",
          type: "group",
          fields: [
            {
              id: "targetCPUUtilization",
              label: "CPU Target (%)",
              type: "number",
              field: "targetCPUUtilization",
              placeholder: "80",
              min: 1,
              max: 100,
            },
            {
              id: "targetMemoryUtilization",
              label: "Memory Target (%)",
              type: "number",
              field: "targetMemoryUtilization",
              placeholder: "-",
              min: 1,
              max: 100,
            },
          ],
        },
      ],
    },
    {
      id: "behavior",
      title: "Scaling Behavior",
      fields: [
        {
          id: "stabilization-group",
          type: "group",
          fields: [
            {
              id: "scaleDownStabilization",
              label: "Scale Down Wait (s)",
              type: "number",
              field: "scaleDownStabilization",
              placeholder: "300",
              min: 0,
            },
            {
              id: "scaleUpStabilization",
              label: "Scale Up Wait (s)",
              type: "number",
              field: "scaleUpStabilization",
              placeholder: "0",
              min: 0,
            },
          ],
        },
      ],
    },
  ],
  statusRenderer: (data, editable) => (
    <HPAStatus data={data as HPANodeData} editable={editable} />
  ),
};
