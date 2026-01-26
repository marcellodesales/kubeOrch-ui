"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
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
import {
  Plus,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  Edit,
  RefreshCw,
  Star,
  Server,
  Loader2,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegistryStore } from "@/stores/RegistryStore";
import { useAuthStore } from "@/stores/AuthStore";
import { Registry, RegistryType } from "@/lib/types/registry";
import { cn } from "@/lib/utils";

// Provider branding configuration
const providerConfig: Record<
  RegistryType,
  {
    name: string;
    icon?: React.ComponentType<{ className?: string }>;
    image?: string;
    bgColor: string;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    hoverBg: string;
  }
> = {
  dockerhub: {
    name: "Docker Hub",
    image: "/icons/registries/docker.png",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    hoverBg: "hover:bg-blue-200 dark:hover:bg-blue-800/50",
  },
  ghcr: {
    name: "GitHub Container Registry",
    image: "/icons/registries/github.png",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
    hoverBg: "hover:bg-purple-200 dark:hover:bg-purple-800/50",
  },
  ecr: {
    name: "AWS Elastic Container Registry",
    image: "/icons/registries/aws.png",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
    iconColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
    hoverBg: "hover:bg-orange-200 dark:hover:bg-orange-800/50",
  },
  gcr: {
    name: "Google Artifact Registry",
    image: "/icons/registries/google-cloud.png",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
    hoverBg: "hover:bg-red-200 dark:hover:bg-red-800/50",
  },
  acr: {
    name: "Azure Container Registry",
    image: "/icons/registries/azure.png",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    iconBg: "bg-sky-100 dark:bg-sky-900/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-200 dark:border-sky-800",
    hoverBg: "hover:bg-sky-200 dark:hover:bg-sky-800/50",
  },
  custom: {
    name: "Custom Registry",
    icon: Server,
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-200 dark:border-slate-700",
    hoverBg: "hover:bg-slate-200 dark:hover:bg-slate-700/50",
  },
};

const statusConfig = {
  connected: {
    text: "Connected",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  },
  disconnected: {
    text: "Disconnected",
    icon: XCircle,
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  error: {
    text: "Error",
    icon: AlertCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
  },
  unknown: {
    text: "Unknown",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400",
  },
};

function formatLastTested(date?: string): string {
  if (!date) return "Never tested";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function PluginsPage() {
  const router = useRouter();
  const {
    registries,
    isLoading,
    fetchRegistries,
    deleteRegistry,
    testConnection,
    setDefault,
  } = useRegistryStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registryToDelete, setRegistryToDelete] = useState<Registry | null>(
    null
  );
  const [testingId, setTestingId] = useState<string | null>(null);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Plugins" },
  ];

  useEffect(() => {
    fetchRegistries();
  }, [fetchRegistries]);

  const handleTestConnection = async (registry: Registry) => {
    setTestingId(registry.id);
    try {
      const result = await testConnection(registry.id);
      if (result.status === "connected") {
        toast.success(`Connection to ${registry.name} successful`);
      } else {
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      toast.error("Failed to test connection");
    } finally {
      setTestingId(null);
    }
  };

  const handleSetDefault = async (registry: Registry) => {
    try {
      await setDefault(registry.id);
      toast.success(`${registry.name} set as default`);
    } catch (error) {
      console.error("Failed to set default:", error);
      toast.error("Failed to set as default");
    }
  };

  const handleDeleteRegistry = (registry: Registry) => {
    setRegistryToDelete(registry);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRegistry = async () => {
    if (!registryToDelete) return;
    try {
      await deleteRegistry(registryToDelete.id);
      toast.success(`Registry deleted successfully`);
    } catch (error) {
      console.error("Failed to delete registry:", error);
      toast.error("Failed to delete registry");
    } finally {
      setDeleteDialogOpen(false);
      setRegistryToDelete(null);
    }
  };

  const pageActions = isAdmin ? (
    <Button onClick={() => router.push("/dashboard/plugins/new")}>
      <Plus className="mr-2 h-4 w-4" />
      Add Registry
    </Button>
  ) : null;

  return (
    <AppLayout>
      <PageContainer
        title="Plugins"
        description="Connect to private container registries to pull images in your workflows"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : registries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              No registries connected
            </h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              {isAdmin
                ? "Connect your first container registry to start pulling private images in your workflows."
                : "No container registries have been configured yet. Contact an admin to set them up."}
            </p>
            {isAdmin && (
              <Button onClick={() => router.push("/dashboard/plugins/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Registry
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {registries.map(registry => {
              const provider = providerConfig[registry.registryType];
              const status = statusConfig[registry.status];
              const Icon = provider.icon;
              const StatusIcon = status.icon;
              const isTesting = testingId === registry.id;

              return (
                <div
                  key={registry.id}
                  className={cn(
                    "group relative flex items-center gap-5 rounded-xl border p-5 transition-all hover:shadow-md",
                    provider.bgColor,
                    provider.borderColor
                  )}
                >
                  {/* Provider Icon */}
                  <div
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
                      provider.iconBg
                    )}
                  >
                    {provider.image ? (
                      <Image
                        src={provider.image}
                        alt={provider.name}
                        width={32}
                        height={32}
                        className="h-8 w-8"
                      />
                    ) : Icon ? (
                      <Icon className={cn("h-7 w-7", provider.iconColor)} />
                    ) : null}
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {registry.name}
                      </h3>
                      {registry.isDefault && (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {provider.name}
                      {registry.registryUrl && (
                        <span className="ml-2 font-mono text-xs opacity-75">
                          {registry.registryUrl}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground/75">
                      Last tested: {formatLastTested(registry.updatedAt)}
                    </p>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Status Badge */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                        status.className
                      )}
                    >
                      {isTesting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <StatusIcon className="h-3.5 w-3.5" />
                      )}
                      <span>{isTesting ? "Testing..." : status.text}</span>
                    </div>

                    {/* Actions Menu */}
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity",
                              provider.hoverBg
                            )}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleTestConnection(registry)}
                            disabled={isTesting}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Test Connection
                          </DropdownMenuItem>
                          {!registry.isDefault && (
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(registry)}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/dashboard/plugins/${registry.id}/edit`
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRegistry(registry)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{registryToDelete?.name}&quot;
              and its credentials. Workflows using this registry will no longer
              be able to pull private images from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRegistryToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRegistry}
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
