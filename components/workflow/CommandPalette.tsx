import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Package,
  Network,
  Globe,
  FileSliders,
  Lock,
  Database,
  HardDrive,
  LucideIcon,
  Monitor,
  Activity,
  Shield,
  GitBranch,
  MessageSquare,
  Archive,
  Play,
  Brain,
  TrendingUp,
  Zap,
  Cloud,
  Key,
  Radio,
  FileText,
  Plug,
  Route,
  Layers,
  RefreshCw,
  Cpu,
  AlertTriangle,
  Container,
  Boxes,
  Share2,
  Shuffle,
  Flame,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAvailableTemplates,
  TemplateMetadata,
} from "@/lib/services/templates";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Icon mapping from template icon name to Lucide component and colors
const ICON_MAP: Record<
  string,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  // Core Kubernetes icons
  Package: {
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  Network: {
    icon: Network,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
  },
  Globe: {
    icon: Globe,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
  },
  FileSliders: {
    icon: FileSliders,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
  },
  Lock: {
    icon: Lock,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  Database: {
    icon: Database,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
  },
  HardDrive: {
    icon: HardDrive,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  // Plugin category icons
  Monitor: {
    icon: Monitor,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  Activity: {
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  Shield: {
    icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  GitBranch: {
    icon: GitBranch,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
  },
  MessageSquare: {
    icon: MessageSquare,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
  },
  MessageCircle: {
    icon: MessageSquare,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
  },
  Archive: {
    icon: Archive,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  Play: {
    icon: Play,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  Brain: {
    icon: Brain,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
  },
  TrendingUp: {
    icon: TrendingUp,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10",
  },
  Zap: {
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
  },
  Cloud: {
    icon: Cloud,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
  },
  Key: {
    icon: Key,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  FileKey: {
    icon: Key,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  Radio: {
    icon: Radio,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  FileText: {
    icon: FileText,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
  },
  Plug: {
    icon: Plug,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
  },
  Route: {
    icon: Route,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  Link: {
    icon: Network,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  Layers: {
    icon: Layers,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
  },
  RefreshCw: {
    icon: RefreshCw,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  Cpu: {
    icon: Cpu,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  Search: {
    icon: Search,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  BarChart2: {
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  BarChart: {
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  Eye: {
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  Bell: {
    icon: Activity,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  Layout: {
    icon: Layers,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
  },
  Box: {
    icon: HardDrive,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  ShieldCheck: {
    icon: Shield,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  Award: {
    icon: Shield,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  Clock: {
    icon: RefreshCw,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
  },
  FileCode: {
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
  },
  CheckSquare: {
    icon: Play,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  Workflow: {
    icon: GitBranch,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
  },
  Hash: {
    icon: Database,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
  },
  BookOpen: {
    icon: FileText,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
  },
  AlertTriangle: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  Container: {
    icon: Container,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  DoorOpen: {
    icon: Globe,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
  },
  Boxes: {
    icon: Boxes,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
  },
  Share2: {
    icon: Share2,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  Settings: {
    icon: FileSliders,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
  },
  Send: {
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  Code: {
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
  },
  Shuffle: {
    icon: Shuffle,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  Skull: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  Wifi: {
    icon: Network,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
  },
  Flame: {
    icon: Flame,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  DollarSign: {
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  Function: {
    icon: Zap,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
  },
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateMetadata) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectTemplate,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load templates when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getAvailableTemplates()
        .then(data => {
          setTemplates(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Failed to load templates:", error);
          toast.error("Failed to load templates");
          setIsLoading(false);
        });
      setSearchQuery("");
      setDebouncedSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Normalize string for search (treat spaces, hyphens, underscores as equivalent)
  const normalizeForSearch = (str: string) =>
    str.toLowerCase().replace(/[-_\s]+/g, " ");

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return templates;
    }

    const query = normalizeForSearch(debouncedSearchQuery);
    return templates.filter(
      template =>
        normalizeForSearch(template.name).includes(query) ||
        normalizeForSearch(template.displayName).includes(query) ||
        normalizeForSearch(template.description).includes(query) ||
        normalizeForSearch(template.category).includes(query) ||
        template.tags.some(tag => normalizeForSearch(tag).includes(query))
    );
  }, [templates, debouncedSearchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredTemplates.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredTemplates[selectedIndex]) {
            handleSelectTemplate(filteredTemplates[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredTemplates, selectedIndex, onClose]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedSearchQuery]);

  const handleSelectTemplate = (template: TemplateMetadata) => {
    onSelectTemplate(template);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      core: "bg-blue-100 text-blue-800",
      networking: "bg-purple-100 text-purple-800",
      storage: "bg-orange-100 text-orange-800",
      configuration: "bg-yellow-100 text-yellow-800",
      security: "bg-red-100 text-red-800",
      monitoring: "bg-green-100 text-green-800",
      virtualization: "bg-blue-100 text-blue-800",
      database: "bg-indigo-100 text-indigo-800",
      messaging: "bg-pink-100 text-pink-800",
      backup: "bg-amber-100 text-amber-800",
      cicd: "bg-emerald-100 text-emerald-800",
      ml: "bg-violet-100 text-violet-800",
      policy: "bg-rose-100 text-rose-800",
      scaling: "bg-teal-100 text-teal-800",
      workflow: "bg-cyan-100 text-cyan-800",
    };
    return colors[category.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base font-semibold">
            Add Component
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-96 border-t">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {debouncedSearchQuery
                ? `No components found for "${debouncedSearchQuery}"`
                : "No components available"}
            </div>
          ) : (
            <div className="p-2">
              {filteredTemplates.map((template, index) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left rounded-md p-3 mb-1 transition-colors ${
                    index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {template.icon && ICON_MAP[template.icon] && (
                          <div
                            className={`p-1 rounded ${ICON_MAP[template.icon].bgColor}`}
                          >
                            {React.createElement(ICON_MAP[template.icon].icon, {
                              className: `h-4 w-4 ${ICON_MAP[template.icon].color}`,
                            })}
                          </div>
                        )}
                        <h3 className="font-semibold text-sm">
                          {template.displayName}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getCategoryColor(template.category)}`}
                        >
                          {template.category}
                        </Badge>
                        {template.tags.slice(0, 3).map(tag => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      v{template.version}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer with keyboard shortcuts hint */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center justify-between">
            <span>
              Use{" "}
              <kbd className="px-1 py-0.5 bg-background border rounded">↑</kbd>{" "}
              <kbd className="px-1 py-0.5 bg-background border rounded">↓</kbd>{" "}
              to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-background border rounded">
                Enter
              </kbd>{" "}
              to select
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
