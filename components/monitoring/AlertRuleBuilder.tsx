"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlertStore } from "@/stores/AlertStore";
import { useNotificationChannelStore } from "@/stores/NotificationChannelStore";
import { useClusterStore } from "@/stores/ClusterStore";
import { toast } from "sonner";
import { Plus, Trash2, Link2, ExternalLink } from "lucide-react";
import { NotificationIcon } from "@/components/notification/NotificationIcon";
import type { NotificationChannelType } from "@/lib/types/notification";
import type {
  AlertRuleType,
  AlertSeverity,
  AlertCondition,
  AlertConditionOperator,
  AlertRule,
  AlertTemplate,
} from "@/lib/services/alerts";

const metricsByType: Record<string, { value: string; label: string }[]> = {
  cluster: [
    { value: "cpu_percentage", label: "CPU Usage (%)" },
    { value: "memory_percentage", label: "Memory Usage (%)" },
    { value: "storage_percentage", label: "Storage Usage (%)" },
    { value: "node_count", label: "Node Count" },
    { value: "cluster_status", label: "Cluster Status" },
  ],
  workflow: [
    { value: "run_status", label: "Run Status" },
    { value: "run_duration", label: "Run Duration (seconds)" },
    { value: "consecutive_failures", label: "Consecutive Failures" },
  ],
  resource: [
    { value: "pod_restart_count", label: "Pod Restart Count" },
    { value: "container_state", label: "Container State" },
    { value: "termination_reason", label: "Termination Reason" },
    { value: "ready_replicas", label: "Ready Replicas" },
    { value: "desired_replicas", label: "Desired Replicas" },
    { value: "pod_phase", label: "Pod Phase" },
    { value: "pvc_usage_percentage", label: "PVC Usage (%)" },
  ],
};

const operators: { value: AlertConditionOperator; label: string }[] = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "==" },
  { value: "neq", label: "!=" },
];

const durations = [
  { value: "0", label: "Instant" },
  { value: "60", label: "1 minute" },
  { value: "300", label: "5 minutes" },
  { value: "600", label: "10 minutes" },
  { value: "1800", label: "30 minutes" },
];

interface AlertRuleBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule?: AlertRule | null;
  prefillTemplate?: AlertTemplate | null;
  prefillType?: AlertRuleType;
  prefillMetric?: string;
  prefillCluster?: string;
}

export function AlertRuleBuilder({
  open,
  onOpenChange,
  editRule,
  prefillTemplate,
  prefillType,
  prefillMetric,
  prefillCluster,
}: AlertRuleBuilderProps) {
  const router = useRouter();
  const { createRule, updateRule } = useAlertStore();
  const { channels, fetchChannels } = useNotificationChannelStore();
  const { clusters, fetchClusters } = useClusterStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<AlertRuleType>("cluster");
  const [severity, setSeverity] = useState<AlertSeverity>("warning");
  const [conditions, setConditions] = useState<AlertCondition[]>([
    { metric: "", operator: "gt", value: "", duration: 0 },
  ]);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchChannels();
      fetchClusters();
      if (editRule) {
        setName(editRule.name);
        setType(editRule.type);
        setSeverity(editRule.severity);
        setConditions(
          editRule.conditions.length > 0
            ? editRule.conditions
            : [{ metric: "", operator: "gt", value: "", duration: 0 }]
        );
        setSelectedClusters(editRule.clusterIds || []);
        setSelectedChannels(editRule.notificationChannelIds || []);
      } else if (prefillTemplate) {
        setName(prefillTemplate.name);
        setType(prefillTemplate.category);
        setSeverity(prefillTemplate.severity);
        setConditions(
          prefillTemplate.conditions.length > 0
            ? prefillTemplate.conditions
            : [{ metric: "", operator: "gt", value: "", duration: 0 }]
        );
        setSelectedClusters([]);
        setSelectedChannels([]);
      } else {
        setName("");
        setType(prefillType || "cluster");
        setSeverity("warning");
        setConditions([
          {
            metric: prefillMetric || "",
            operator: "gt",
            value: "",
            duration: 0,
          },
        ]);
        setSelectedClusters(prefillCluster ? [prefillCluster] : []);
        setSelectedChannels([]);
      }
    }
  }, [
    open,
    editRule,
    prefillTemplate,
    prefillType,
    prefillMetric,
    prefillCluster,
    fetchChannels,
    fetchClusters,
  ]);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { metric: "", operator: "gt", value: "", duration: 0 },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (
    index: number,
    field: keyof AlertCondition,
    value: unknown
  ) => {
    setConditions(
      conditions.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Rule name is required");
      return;
    }
    if (conditions.some(c => !c.metric)) {
      toast.error("All conditions must have a metric selected");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name,
        type,
        severity,
        conditions: conditions.map(c => ({
          ...c,
          value: isNaN(Number(c.value)) ? c.value : Number(c.value),
          duration: Number(c.duration),
        })),
        clusterIds: selectedClusters.length > 0 ? selectedClusters : undefined,
        notificationChannelIds:
          selectedChannels.length > 0 ? selectedChannels : undefined,
      };

      if (editRule) {
        await updateRule(editRule.id, data);
        toast.success("Rule updated");
      } else {
        await createRule(data);
        toast.success("Rule created");
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableMetrics = metricsByType[type] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>
            {editRule ? "Edit Alert Rule" : "New Alert Rule"}
          </DialogTitle>
          <DialogDescription>
            Configure conditions to trigger alerts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basics */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., High CPU Alert"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={v => {
                    setType(v as AlertRuleType);
                    setConditions([
                      { metric: "", operator: "gt", value: "", duration: 0 },
                    ]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cluster">Cluster</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select
                  value={severity}
                  onValueChange={v => setSeverity(v as AlertSeverity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Conditions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCondition}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>

            {conditions.map((cond, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Condition {i + 1}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(i)}
                    disabled={conditions.length === 1}
                    className="h-7 w-7"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={cond.metric}
                    onValueChange={v => updateCondition(i, "metric", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMetrics.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={cond.operator}
                    onValueChange={v => updateCondition(i, "operator", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Op" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={String(cond.value)}
                    onChange={e => updateCondition(i, "value", e.target.value)}
                    placeholder="Value (e.g. 80)"
                  />
                  <Select
                    value={String(cond.duration)}
                    onValueChange={v =>
                      updateCondition(i, "duration", Number(v))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {/* Scope */}
          <div className="space-y-3">
            <Label>Target Cluster</Label>
            <p className="text-xs text-muted-foreground">
              Applies to all clusters by default. Select a specific cluster to
              narrow scope.
            </p>
            <div>
              <Select
                value={selectedClusters[0] || "all"}
                onValueChange={v => setSelectedClusters(v === "all" ? [] : [v])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All clusters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clusters</SelectItem>
                  {clusters.map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.displayName || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Notification Channels</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  router.push("/dashboard/integrations/notifications")
                }
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Manage Channels
              </Button>
            </div>
            {channels.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
                <Link2 className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    No notification channels configured
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set up webhook channels to receive alert notifications
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      "/dashboard/integrations/notifications",
                      "_blank"
                    )
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Notification Channel
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {channels.map(ch => (
                  <label
                    key={ch.id}
                    className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedChannels.includes(ch.id)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedChannels([...selectedChannels, ch.id]);
                        } else {
                          setSelectedChannels(
                            selectedChannels.filter(id => id !== ch.id)
                          );
                        }
                      }}
                    />
                    <NotificationIcon
                      type={ch.type as NotificationChannelType}
                      size="sm"
                    />
                    <span className="text-sm">{ch.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto capitalize">
                      {ch.type}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : editRule
                ? "Update Rule"
                : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
