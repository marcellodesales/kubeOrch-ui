import React from "react";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { JobNodeData } from "@/lib/types/nodes";
import { EnvVarsEditor } from "./EnvVarsEditor";

// Status renderer for Job nodes
function JobStatus({ data }: { data: JobNodeData; editable: boolean }) {
  if (!data._status) return null;

  const getStatusIcon = () => {
    switch (data._status?.state) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "failed":
        return <XCircle className="h-3 w-3" />;
      case "running":
        return <Clock className="h-3 w-3 animate-spin" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusVariant = () => {
    switch (data._status?.state) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge variant={getStatusVariant()} className="flex items-center gap-1">
          {getStatusIcon()}
          {data._status.state || "pending"}
        </Badge>
      </div>

      {data._status.succeeded !== undefined && (
        <div className="text-xs text-muted-foreground">
          Succeeded: {data._status.succeeded} /{" "}
          {data._status.completions ?? data.completions ?? 1}
          {data._status.failed ? ` | Failed: ${data._status.failed}` : ""}
          {data._status.active ? ` | Active: ${data._status.active}` : ""}
        </div>
      )}

      {data._status.state === "failed" && data._status.message && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{data._status.message}</p>
        </div>
      )}
    </div>
  );
}

export const jobSettingsConfig: NodeSettingsConfig = {
  title: "Job Settings",
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
          id: "image",
          label: "Docker Image *",
          type: "text",
          field: "image",
          placeholder: "postgres:15",
          required: true,
        },
        {
          id: "command",
          label: "Command",
          type: "stringarray",
          field: "command",
          placeholder: "/bin/sh, -c, echo hello",
          description: "Container entrypoint (comma-separated)",
        },
        {
          id: "args",
          label: "Args",
          type: "stringarray",
          field: "args",
          placeholder: "--verbose, --timeout=30",
          description: "Arguments to the command (comma-separated)",
        },
      ],
    },
    {
      id: "job-behavior",
      title: "Job Behavior",
      fields: [
        {
          id: "completions-parallelism-group",
          type: "group",
          fields: [
            {
              id: "completions",
              label: "Completions",
              type: "number",
              field: "completions",
              placeholder: "1",
              min: 1,
            },
            {
              id: "parallelism",
              label: "Parallelism",
              type: "number",
              field: "parallelism",
              placeholder: "1",
              min: 1,
            },
          ],
        },
        {
          id: "backoff-restart-group",
          type: "group",
          fields: [
            {
              id: "backoffLimit",
              label: "Backoff Limit",
              type: "number",
              field: "backoffLimit",
              placeholder: "6",
              min: 0,
            },
            {
              id: "restartPolicy",
              label: "Restart Policy",
              type: "select",
              field: "restartPolicy",
              options: [
                { value: "Never", label: "Never" },
                { value: "OnFailure", label: "OnFailure" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lifecycle",
      title: "Lifecycle",
      fields: [
        {
          id: "deadline-ttl-group",
          type: "group",
          fields: [
            {
              id: "activeDeadlineSeconds",
              label: "Active Deadline (s)",
              type: "number",
              field: "activeDeadlineSeconds",
              placeholder: "No limit",
              min: 1,
            },
            {
              id: "ttlSecondsAfterFinished",
              label: "TTL After Finish (s)",
              type: "number",
              field: "ttlSecondsAfterFinished",
              placeholder: "No auto-delete",
              min: 0,
            },
          ],
        },
      ],
    },
    {
      id: "limits",
      title: "Resource Limits",
      fields: [
        {
          id: "limits-group",
          type: "group",
          fields: [
            {
              id: "cpu-limit",
              label: "CPU Limit",
              type: "text",
              field: "resources.limits.cpu",
              placeholder: "500m",
            },
            {
              id: "mem-limit",
              label: "Memory Limit",
              type: "text",
              field: "resources.limits.memory",
              placeholder: "512Mi",
            },
          ],
        },
      ],
    },
  ],
  statusRenderer: (data, editable) => (
    <JobStatus data={data as JobNodeData} editable={editable} />
  ),
  extraContent: (data, { nodeId, editable }) => (
    <EnvVarsEditor
      data={data as JobNodeData}
      nodeId={nodeId}
      editable={editable}
    />
  ),
};
