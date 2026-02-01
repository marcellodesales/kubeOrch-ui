"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plug, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePluginStore } from "@/stores/PluginStore";
import { PluginCategory, PluginWithStatus } from "@/lib/services/plugins";
import { cn } from "@/lib/utils";

// Category configuration with colors
const categoryConfig: Record<
  PluginCategory | string,
  {
    name: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  virtualization: {
    name: "Virtualization",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  networking: {
    name: "Networking",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  storage: {
    name: "Storage",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  monitoring: {
    name: "Monitoring",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  security: {
    name: "Security",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
  workflow: {
    name: "Workflow",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  database: {
    name: "Database",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
  },
  messaging: {
    name: "Messaging",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
  backup: {
    name: "Backup",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  cicd: {
    name: "CI/CD",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  ml: {
    name: "ML & AI",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  policy: {
    name: "Policy",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
  scaling: {
    name: "Scaling",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
  },
};

function PluginCard({
  plugin,
  onToggle,
  isToggling,
}: {
  plugin: PluginWithStatus;
  onToggle: (id: string, enabled: boolean) => void;
  isToggling: boolean;
}) {
  const config = categoryConfig[plugin.category] || categoryConfig.workflow;

  return (
    <Card
      className={cn(
        "relative transition-all hover:shadow-md",
        config.bgColor,
        config.borderColor,
        plugin.enabled && "ring-2 ring-primary/50"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-base">{plugin.displayName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {config.name}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  v{plugin.version}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : plugin.enabled ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : null}
            <Switch
              checked={plugin.enabled}
              onCheckedChange={checked => onToggle(plugin.id, checked)}
              disabled={isToggling}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm mb-3">
          {plugin.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1.5">
          {plugin.crdKinds.map(kind => (
            <Badge
              key={kind}
              variant="secondary"
              className="text-xs font-mono bg-white/50 dark:bg-slate-800/50"
            >
              {kind}
            </Badge>
          ))}
        </div>
        {plugin.enabled && plugin.nodeTypes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1.5">
              Available in workflow canvas:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {plugin.nodeTypes.map(nodeType => (
                <Badge
                  key={nodeType.name}
                  className="text-xs bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {nodeType.displayName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PluginsPage() {
  const { plugins, isLoading, fetchPlugins, enablePlugin, disablePlugin } =
    usePluginStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [togglingPlugins, setTogglingPlugins] = useState<Set<string>>(
    new Set()
  );

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Integrations", href: "/dashboard/integrations" },
    { label: "Plugins" },
  ];

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleTogglePlugin = async (id: string, enabled: boolean) => {
    setTogglingPlugins(prev => new Set(prev).add(id));
    try {
      if (enabled) {
        await enablePlugin(id);
        toast.success("Plugin enabled successfully");
      } else {
        await disablePlugin(id);
        toast.success("Plugin disabled successfully");
      }
    } catch (error) {
      console.error("Failed to toggle plugin:", error);
      toast.error(
        enabled ? "Failed to enable plugin" : "Failed to disable plugin"
      );
    } finally {
      setTogglingPlugins(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Filter plugins
  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch =
      searchQuery === "" ||
      plugin.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.crdKinds.some(kind =>
        kind.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      categoryFilter === "all" || plugin.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories from plugins
  const categories = Array.from(new Set(plugins.map(p => p.category)));

  const enabledCount = plugins.filter(p => p.enabled).length;

  return (
    <AppLayout>
      <PageContainer
        title="CRD Plugins"
        description="Enable Kubernetes Custom Resource Definition plugins to add new node types to your workflows"
        breadcrumbs={breadcrumbs}
      >
        {/* Stats and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Plug className="h-4 w-4" />
            <span>
              {enabledCount} of {plugins.length} plugins enabled
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {categoryConfig[category]?.name || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Plugin grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plug className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No plugins found</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No CRD plugins are available at the moment."}
            </p>
            {(searchQuery || categoryFilter !== "all") && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlugins.map(plugin => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={handleTogglePlugin}
                isToggling={togglingPlugins.has(plugin.id)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
