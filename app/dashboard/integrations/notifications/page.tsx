"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationChannelStore } from "@/stores/NotificationChannelStore";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Loader2,
  X,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import type { NotificationChannel } from "@/lib/services/notifications";
import type {
  NotificationChannelType,
  NotificationChannelTypeInfo,
} from "@/lib/types/notification";
import { NOTIFICATION_CHANNEL_TYPES } from "@/lib/types/notification";
import {
  NotificationIcon,
  notificationConfig,
} from "@/components/notification/NotificationIcon";
import { toast } from "sonner";

function maskSecret(value: string): string {
  if (value.length <= 8) return "***";
  return value.slice(0, 4) + "***" + value.slice(-4);
}

function getChannelSubtitle(channel: NotificationChannel): string {
  const cfg = channel.config;
  if (channel.type === "webhook") {
    try {
      const parsed = new URL(cfg.url as string);
      return `${parsed.protocol}//${parsed.host}/***`;
    } catch {
      return "***";
    }
  }
  if (channel.type === "telegram") {
    return `Chat: ${cfg.chat_id || "***"}`;
  }
  if (channel.type === "pagerduty") {
    return `Routing key: ${maskSecret((cfg.routing_key as string) || "")}`;
  }
  // slack, discord, teams — all use webhook_url
  const url = cfg.webhook_url as string;
  if (url) {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}/***`;
    } catch {
      return "***";
    }
  }
  return "";
}

export default function NotificationsPage() {
  const {
    channels,
    isLoading,
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    testChannel,
  } = useNotificationChannelStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<"type" | "config">("type");
  const [selectedType, setSelectedType] =
    useState<NotificationChannelTypeInfo | null>(null);
  const [editChannel, setEditChannel] = useState<NotificationChannel | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] =
    useState<NotificationChannel | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Integrations", href: "/dashboard/integrations" },
    { label: "Notifications" },
  ];

  const openCreateDialog = () => {
    setEditChannel(null);
    setSelectedType(null);
    setDialogStep("type");
    setName("");
    setConfigValues({});
    setHeaders([]);
    setDialogOpen(true);
  };

  const openEditDialog = (channel: NotificationChannel) => {
    setEditChannel(channel);
    const typeInfo = NOTIFICATION_CHANNEL_TYPES.find(
      t => t.type === channel.type
    );
    setSelectedType(typeInfo || null);
    setDialogStep("config");
    setName(channel.name);

    // Populate config values from channel
    const values: Record<string, string> = {};
    if (typeInfo) {
      for (const field of typeInfo.fields) {
        values[field.key] = (channel.config[field.key] as string) || "";
      }
    }
    setConfigValues(values);

    // Populate headers for webhook type
    const h = channel.config.headers as Record<string, string> | undefined;
    setHeaders(
      h ? Object.entries(h).map(([key, value]) => ({ key, value })) : []
    );
    setDialogOpen(true);
  };

  const selectType = (typeInfo: NotificationChannelTypeInfo) => {
    setSelectedType(typeInfo);
    setDialogStep("config");
    setConfigValues({});
    setHeaders([]);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Validate required fields
    for (const field of selectedType.fields) {
      if (field.required && !configValues[field.key]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const config: Record<string, unknown> = {};
      for (const field of selectedType.fields) {
        if (configValues[field.key]?.trim()) {
          config[field.key] = configValues[field.key];
        }
      }

      // Add custom headers for webhook type
      if (selectedType.type === "webhook") {
        const headerMap: Record<string, string> = {};
        headers.forEach(h => {
          if (h.key.trim()) headerMap[h.key] = h.value;
        });
        if (Object.keys(headerMap).length > 0) {
          config.headers = headerMap;
        }
      }

      const data = {
        name,
        type: selectedType.type,
        config,
      };

      if (editChannel) {
        await updateChannel(editChannel.id, data);
      } else {
        await createChannel(data);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save channel:", error);
      toast.error("Failed to save channel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (channel: NotificationChannel) => {
    setTestingId(channel.id);
    try {
      await testChannel(channel.id);
    } catch {
      toast.error("Test failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = (channel: NotificationChannel) => {
    setChannelToDelete(channel);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!channelToDelete) return;
    try {
      await deleteChannel(channelToDelete.id);
    } catch {
      toast.error("Failed to delete channel");
    } finally {
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    }
  };

  const pageActions = (
    <Button onClick={openCreateDialog}>
      <Plus className="mr-2 h-4 w-4" />
      Add Channel
    </Button>
  );

  return (
    <AppLayout>
      <PageContainer
        title="Notification Channels"
        description="Configure notification endpoints for alert notifications"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              No notification channels configured
            </h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Add a notification channel to receive alerts from your monitoring
              rules via Slack, Discord, Telegram, and more.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first channel
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {channels.map(channel => {
              const isTesting = testingId === channel.id;
              const config =
                notificationConfig[channel.type as NotificationChannelType] ||
                notificationConfig.webhook;
              return (
                <div
                  key={channel.id}
                  className="group relative flex items-center gap-5 rounded-xl border p-5 transition-all hover:shadow-md bg-card"
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden ${config.bgColor}`}
                  >
                    <NotificationIcon
                      type={channel.type as NotificationChannelType}
                      size="lg"
                      fillContainer
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {channel.name}
                      </h3>
                      <Badge variant="outline" className="text-xs font-normal">
                        {config.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          channel.enabled
                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-green-200 dark:border-green-800"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        {channel.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground/75 truncate">
                      {getChannelSubtitle(channel)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(channel)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-1 h-3.5 w-3.5" />
                      )}
                      {isTesting ? "Testing..." : "Test"}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(channel)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(channel)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>

      {/* Add/Edit Channel Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) {
            setDialogStep("type");
            setSelectedType(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {dialogStep === "type" && !editChannel ? (
            <>
              <DialogHeader>
                <DialogTitle>Add Notification Channel</DialogTitle>
                <DialogDescription>
                  Choose a notification type to get started
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 py-4">
                {NOTIFICATION_CHANNEL_TYPES.map(typeInfo => {
                  const iconCfg = notificationConfig[typeInfo.type];
                  return (
                    <button
                      key={typeInfo.type}
                      onClick={() => selectType(typeInfo)}
                      className="flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-foreground/25 hover:shadow-sm hover:bg-muted/50"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden ${iconCfg.bgColor}`}
                      >
                        <NotificationIcon
                          type={typeInfo.type}
                          size="md"
                          fillContainer
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{typeInfo.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {typeInfo.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {!editChannel && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 -ml-1"
                      onClick={() => {
                        setDialogStep("type");
                        setSelectedType(null);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {selectedType && (
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md overflow-hidden ${notificationConfig[selectedType.type].bgColor}`}
                    >
                      <NotificationIcon
                        type={selectedType.type}
                        size="sm"
                        fillContainer
                      />
                    </div>
                  )}
                  {editChannel
                    ? "Edit Channel"
                    : `Add ${selectedType?.name || ""} Channel`}
                </DialogTitle>
                <DialogDescription>
                  {selectedType?.description ||
                    "Configure the notification channel"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="channel-name">Name</Label>
                  <Input
                    id="channel-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={`e.g., ${selectedType?.name || "My"} Alerts`}
                  />
                </div>

                {selectedType?.fields.map(field => (
                  <div key={field.key}>
                    <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`field-${field.key}`}
                      value={configValues[field.key] || ""}
                      onChange={e =>
                        setConfigValues({
                          ...configValues,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      type={field.type}
                    />
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.helpText}
                      </p>
                    )}
                  </div>
                ))}

                {/* Custom headers for webhook type */}
                {selectedType?.type === "webhook" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Custom Headers (optional)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setHeaders([...headers, { key: "", value: "" }])
                        }
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                    {headers.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <Input
                          value={h.key}
                          onChange={e => {
                            const next = [...headers];
                            next[i].key = e.target.value;
                            setHeaders(next);
                          }}
                          placeholder="Header name"
                          className="flex-1"
                        />
                        <Input
                          value={h.value}
                          onChange={e => {
                            const next = [...headers];
                            next[i].value = e.target.value;
                            setHeaders(next);
                          }}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setHeaders(headers.filter((_, j) => j !== i))
                          }
                          className="h-9 w-9 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Help link */}
                {selectedType?.helpLink && (
                  <p className="text-xs text-muted-foreground">
                    {selectedType.helpLink.prefix}{" "}
                    <a
                      href={selectedType.helpLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {selectedType.helpLink.linkText}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editChannel
                      ? "Update"
                      : "Create"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{channelToDelete?.name}&quot;.
              Alert rules using this channel will no longer send notifications
              to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChannelToDelete(null)}>
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
    </AppLayout>
  );
}
