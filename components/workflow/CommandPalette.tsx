import React, { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvailableTemplates, TemplateMetadata } from "@/lib/services/templates";
import { Badge } from "@/components/ui/badge";

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
          setIsLoading(false);
        });
      setSearchQuery("");
      setDebouncedSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return templates;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return templates.filter(
      template =>
        template.name.toLowerCase().includes(query) ||
        template.displayName.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
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
      storage: "bg-green-100 text-green-800",
      configuration: "bg-yellow-100 text-yellow-800",
      security: "bg-red-100 text-red-800",
      monitoring: "bg-orange-100 text-orange-800",
    };
    return colors[category.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: "border-green-500 text-green-700",
      intermediate: "border-yellow-500 text-yellow-700",
      advanced: "border-red-500 text-red-700",
    };
    return colors[difficulty.toLowerCase()] || "border-gray-500 text-gray-700";
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
                    index === selectedIndex
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {template.icon && (
                          <span className="text-lg">{template.icon}</span>
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
                        <Badge
                          variant="outline"
                          className={`text-xs ${getDifficultyColor(template.difficulty)}`}
                        >
                          {template.difficulty}
                        </Badge>
                        {template.tags.slice(0, 2).map(tag => (
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
              Use <kbd className="px-1 py-0.5 bg-background border rounded">↑</kbd>{" "}
              <kbd className="px-1 py-0.5 bg-background border rounded">↓</kbd> to
              navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-background border rounded">Enter</kbd> to
              select
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
