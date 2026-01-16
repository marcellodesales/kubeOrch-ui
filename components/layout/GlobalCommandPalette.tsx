"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  search,
  SearchResults,
  WorkflowSearchResult,
  ResourceSearchResult,
  ClusterSearchResult,
} from "@/lib/services/search";
import { useSidebarStore } from "@/stores/SidebarStore";
import {
  Home,
  GitBranch,
  Box,
  Server,
  Settings,
  Puzzle,
  Activity,
  Plus,
  Layout,
  Package,
  Loader2,
} from "lucide-react";

interface GlobalCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Static page navigation items
const pages = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home,
    keywords: ["home", "overview"],
  },
  {
    name: "Clusters",
    path: "/dashboard/clusters",
    icon: Server,
    keywords: ["kubernetes", "k8s"],
  },
  {
    name: "Add Cluster",
    path: "/dashboard/clusters/new",
    icon: Package,
    keywords: ["new", "create"],
  },
  {
    name: "Workflows",
    path: "/dashboard/workflow",
    icon: GitBranch,
    keywords: ["flow", "pipeline"],
  },
  {
    name: "New Workflow",
    path: "/dashboard/workflow/new",
    icon: Plus,
    keywords: ["create", "add"],
  },
  {
    name: "Templates",
    path: "/dashboard/workflow/templates",
    icon: Layout,
    keywords: ["template"],
  },
  {
    name: "Resources",
    path: "/dashboard/resources",
    icon: Box,
    keywords: ["pods", "deployments", "services"],
  },
  {
    name: "Plugins",
    path: "/dashboard/plugins",
    icon: Puzzle,
    keywords: ["extensions", "addon"],
  },
  {
    name: "Monitoring",
    path: "/dashboard/monitoring",
    icon: Activity,
    keywords: ["metrics", "logs"],
  },
  {
    name: "Settings",
    path: "/dashboard/settings",
    icon: Settings,
    keywords: ["config", "preferences"],
  },
];

export function GlobalCommandPalette({
  open,
  onOpenChange,
}: GlobalCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { setMenuOpen } = useSidebarStore();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setIsSearching(false);
    }
  }, [open]);

  // Debounced search (300ms) - only when 3+ characters
  useEffect(() => {
    if (query.length < 3) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await search(query);
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Navigation handlers with sidebar context
  const navigateToPage = useCallback(
    (path: string) => {
      router.push(path);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  const navigateToWorkflow = useCallback(
    (workflow: WorkflowSearchResult) => {
      setMenuOpen("Workflow Designer", true);
      router.push(`/dashboard/workflow/${workflow.id}`);
      onOpenChange(false);
    },
    [router, onOpenChange, setMenuOpen]
  );

  const navigateToResource = useCallback(
    (resource: ResourceSearchResult) => {
      setMenuOpen("Resources", true);
      router.push(`/dashboard/resources/${resource.id}`);
      onOpenChange(false);
    },
    [router, onOpenChange, setMenuOpen]
  );

  const navigateToCluster = useCallback(
    (cluster: ClusterSearchResult) => {
      setMenuOpen("Clusters", true);
      router.push(`/dashboard/clusters/${cluster.name}`);
      onOpenChange(false);
    },
    [router, onOpenChange, setMenuOpen]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 max-w-[640px] top-[15vh] translate-y-0"
        showCloseButton={false}
      >
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide">
          <div className="flex items-center border-b px-4">
            <Command.Input
              placeholder="Search pages, workflows, resources..."
              value={query}
              onValueChange={setQuery}
              className="flex h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              {query.length > 0 && query.length < 3
                ? "Type at least 3 characters to search..."
                : "No results found."}
            </Command.Empty>

            {/* Static Pages - Always visible */}
            <Command.Group heading="Pages">
              {pages.map(page => (
                <Command.Item
                  key={page.path}
                  value={`${page.name} ${page.keywords.join(" ")}`}
                  onSelect={() => navigateToPage(page.path)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent"
                >
                  <page.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{page.name}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Dynamic Results - Only after 3+ chars and results exist */}
            {results?.workflows && results.workflows.length > 0 && (
              <Command.Group heading="Workflows">
                {results.workflows.map(workflow => (
                  <Command.Item
                    key={workflow.id}
                    value={`workflow ${workflow.name} ${workflow.description}`}
                    onSelect={() => navigateToWorkflow(workflow)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{workflow.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {workflow.status}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.resources && results.resources.length > 0 && (
              <Command.Group heading="Resources">
                {results.resources.map(resource => (
                  <Command.Item
                    key={resource.id}
                    value={`resource ${resource.name} ${resource.namespace} ${resource.type}`}
                    onSelect={() => navigateToResource(resource)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{resource.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {resource.type} • {resource.namespace}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.clusters && results.clusters.length > 0 && (
              <Command.Group heading="Clusters">
                {results.clusters.map(cluster => (
                  <Command.Item
                    key={cluster.name}
                    value={`cluster ${cluster.name} ${cluster.displayName}`}
                    onSelect={() => navigateToCluster(cluster)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{cluster.displayName || cluster.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {cluster.status}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="flex items-center gap-4 border-t px-4 py-2.5 text-xs text-muted-foreground bg-muted/50">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">
                esc
              </kbd>
              Close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
