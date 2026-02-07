import React from "react";
import { CheckCircle2, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NodeSettingsConfig } from "../NodeSettingsPanel";
import { CronJobNodeData } from "@/lib/types/nodes";
import { EnvVarsEditor } from "./EnvVarsEditor";

// Status renderer for CronJob nodes
function CronJobStatus({ data }: { data: CronJobNodeData; editable: boolean }) {
  if (!data._status) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <Badge
          variant={data._status.state === "suspended" ? "secondary" : "default"}
          className="flex items-center gap-1"
        >
          {data._status.state === "suspended" ? (
            <PauseCircle className="h-3 w-3" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {data._status.state || "active"}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        {data._status.lastScheduleTime && (
          <div>Last scheduled: {data._status.lastScheduleTime}</div>
        )}
        {data._status.lastSuccessfulTime && (
          <div>Last success: {data._status.lastSuccessfulTime}</div>
        )}
        {data._status.activeJobs !== undefined &&
          data._status.activeJobs > 0 && (
            <div>Active jobs: {data._status.activeJobs}</div>
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

export const cronJobSettingsConfig: NodeSettingsConfig = {
  title: "CronJob Settings",
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
          id: "schedule",
          label: "Schedule (Cron) *",
          type: "text",
          field: "schedule",
          placeholder: "0 2 * * *",
          required: true,
          description:
            "Format: minute hour day-of-month month day-of-week\n0 2 * * *  →  Daily at 2 AM\n*/15 * * * *  →  Every 15 min\n0 0 * * 0  →  Weekly on Sunday",
        },
        {
          id: "image",
          label: "Docker Image *",
          type: "text",
          field: "image",
          placeholder: "backup-tool:latest",
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
          id: "concurrency-suspend-group",
          type: "group",
          fields: [
            {
              id: "concurrencyPolicy",
              label: "Concurrency Policy",
              type: "select",
              field: "concurrencyPolicy",
              options: [
                { value: "Allow", label: "Allow" },
                { value: "Forbid", label: "Forbid" },
                { value: "Replace", label: "Replace" },
              ],
            },
            {
              id: "suspend",
              label: "Suspended",
              type: "toggle",
              field: "suspend",
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
                { value: "OnFailure", label: "OnFailure" },
                { value: "Never", label: "Never" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "history",
      title: "History Limits",
      fields: [
        {
          id: "history-group",
          type: "group",
          fields: [
            {
              id: "successfulJobsHistoryLimit",
              label: "Successful Jobs",
              type: "number",
              field: "successfulJobsHistoryLimit",
              placeholder: "3",
              min: 0,
            },
            {
              id: "failedJobsHistoryLimit",
              label: "Failed Jobs",
              type: "number",
              field: "failedJobsHistoryLimit",
              placeholder: "1",
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
    <CronJobStatus data={data as CronJobNodeData} editable={editable} />
  ),
  extraContent: (data, { nodeId, editable }) => (
    <EnvVarsEditor
      data={data as CronJobNodeData}
      nodeId={nodeId}
      editable={editable}
    />
  ),
};
