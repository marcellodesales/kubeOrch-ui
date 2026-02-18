"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAlertStore } from "@/stores/AlertStore";
import { useNotificationChannelStore } from "@/stores/NotificationChannelStore";
import { SeverityBadge } from "./SeverityBadge";
import { AlertRuleBuilder } from "./AlertRuleBuilder";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Server,
  GitBranch,
  Box,
  Check,
  Loader2,
} from "lucide-react";
import type { AlertRule, AlertTemplate } from "@/lib/services/alerts";
import { toast } from "sonner";

const typeConfig = {
  cluster: {
    label: "Cluster",
    icon: Server,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  },
  workflow: {
    label: "Workflow",
    icon: GitBranch,
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
  },
  resource: {
    label: "Resource",
    icon: Box,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  },
};

export function AlertRulesTab() {
  const {
    rules,
    templates,
    fetchRules,
    fetchTemplates,
    toggleRule,
    deleteRule,
    enableTemplate,
    isLoading,
  } = useAlertStore();
  const { fetchChannels } = useNotificationChannelStore();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editRule, setEditRule] = useState<AlertRule | null>(null);
  const [builderTemplate, setBuilderTemplate] = useState<AlertTemplate | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AlertRule | null>(null);
  const [enablingTemplateId, setEnablingTemplateId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchRules();
    fetchTemplates();
    fetchChannels();
  }, [fetchRules, fetchTemplates, fetchChannels]);

  const handleQuickEnable = async (template: AlertTemplate) => {
    setEnablingTemplateId(template.id);
    try {
      await enableTemplate(template.id);
    } catch {
      toast.error("Failed to enable template");
    } finally {
      setEnablingTemplateId(null);
    }
  };

  const handleAddForCluster = (template: AlertTemplate) => {
    setEditRule(null);
    setBuilderTemplate(template);
    setBuilderOpen(true);
  };

  const handleDeleteRule = (rule: AlertRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRule(ruleToDelete.id);
    } catch {
      toast.error("Failed to delete rule");
    } finally {
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  // Count how many rules exist per template
  const templateRuleCounts = rules
    .filter(r => r.isPredefined)
    .reduce<Record<string, number>>((acc, r) => {
      if (r.templateId) acc[r.templateId] = (acc[r.templateId] || 0) + 1;
      return acc;
    }, {});

  const customRules = rules.filter(r => !r.isPredefined);

  if (isLoading && rules.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Predefined Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Predefined Templates</CardTitle>
          <CardDescription>
            One-click setup for common alerting scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => {
              const activeCount = templateRuleCounts[template.id] || 0;
              const tc = typeConfig[template.category];
              const TypeIcon = tc?.icon || Server;

              return (
                <div
                  key={template.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-md p-1.5 ${tc?.className}`}>
                        <TypeIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium">
                        {template.name}
                      </span>
                    </div>
                    <SeverityBadge
                      severity={template.severity}
                      showIcon={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-auto flex items-center gap-2">
                    {activeCount > 0 ? (
                      <>
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-green-200 dark:border-green-800"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          {activeCount} active
                        </Badge>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleAddForCluster(template)}
                          title="Add for another cluster"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickEnable(template)}
                        disabled={enablingTemplateId === template.id}
                      >
                        {enablingTemplateId === template.id ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {enablingTemplateId === template.id
                          ? "Enabling..."
                          : "Enable"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Custom Rules</CardTitle>
            <CardDescription>Your custom alert configurations</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditRule(null);
              setBuilderTemplate(null);
              setBuilderOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Rule
          </Button>
        </CardHeader>
        <CardContent>
          {customRules.length === 0 &&
          rules.filter(r => r.isPredefined).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No custom alert rules yet
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setEditRule(null);
                  setBuilderTemplate(null);
                  setBuilderOpen(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Create your first rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...rules.filter(r => r.isPredefined), ...customRules].map(
                  rule => {
                    const tc = typeConfig[rule.type];
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          {rule.name}
                          {rule.isPredefined && (
                            <Badge
                              variant="secondary"
                              className="ml-2 text-[10px]"
                            >
                              Template
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tc?.className}>
                            {tc?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <SeverityBadge
                            severity={rule.severity}
                            showIcon={false}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={checked =>
                              toggleRule(rule.id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {rule.lastTriggeredAt
                            ? new Date(
                                rule.lastTriggeredAt
                              ).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditRule(rule);
                                  setBuilderOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteRule(rule)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rule Builder Dialog */}
      <AlertRuleBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        editRule={editRule}
        prefillTemplate={builderTemplate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{ruleToDelete?.name}&quot; and
              stop all monitoring for this rule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRuleToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
