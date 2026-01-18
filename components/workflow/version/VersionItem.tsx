"use client";

import React from "react";
import { RotateCcw, Clock, Zap, User, CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkflowVersion } from "@/lib/services/workflow";

interface VersionItemProps {
  version: WorkflowVersion;
  isCurrent: boolean;
  latestVersion: number;
  onRestore: () => void;
  onCompare: () => void;
}

function RunStatusIcon({ status }: { status?: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    case "running":
      return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
    default:
      return null;
  }
}

export default function VersionItem({
  version,
  isCurrent,
  latestVersion,
  onRestore,
  onCompare,
}: VersionItemProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nodeCount = version.nodes?.length || 0;

  return (
    <div
      className={`border rounded-lg p-3 transition-colors ${
        isCurrent
          ? "border-primary/50 bg-primary/5"
          : "border-border hover:border-border/80 hover:bg-muted/30"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <RunStatusIcon status={version.run_status} />
          <span className="font-medium text-sm">v{version.version}</span>
          {isCurrent && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              Current
            </Badge>
          )}
          {version.tag && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {version.tag}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isCurrent && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onCompare}
                title={`Compare v${version.version} with v${latestVersion}`}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onRestore}
                title="Restore this version"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Name/Description */}
      {(version.name || version.description) && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {version.name || version.description}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(version.created_at)}
        </span>
        <span className="flex items-center gap-1">
          {version.is_automatic ? (
            <>
              <Zap className="h-3 w-3" />
              Auto
            </>
          ) : (
            <>
              <User className="h-3 w-3" />
              Manual
            </>
          )}
        </span>
        <span>{nodeCount} nodes</span>
        {version.restored_from && (
          <span className="text-primary">
            Restored from v{version.restored_from}
          </span>
        )}
      </div>
    </div>
  );
}
