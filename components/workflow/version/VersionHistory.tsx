"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getWorkflowVersions,
  createWorkflowVersion,
  restoreWorkflowVersion,
  type WorkflowVersion,
  type WorkflowNode,
  type WorkflowEdge,
} from "@/lib/services/workflow";
import VersionItem from "./VersionItem";
import CreateVersionDialog from "./CreateVersionDialog";
import RestoreConfirmDialog from "./RestoreConfirmDialog";

interface VersionHistoryProps {
  workflowId: string;
  onRestore?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
}

export default function VersionHistory({
  workflowId,
  onRestore,
}: VersionHistoryProps) {
  const router = useRouter();
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [latestVersion, setLatestVersion] = useState(0);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] =
    useState<WorkflowVersion | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const loadVersions = useCallback(async () => {
    if (!workflowId) return;

    setLoading(true);
    try {
      const response = await getWorkflowVersions(workflowId, page, limit);
      setVersions(response.versions);
      setTotal(response.total);
      // Track the latest version (first item on page 1 is the latest)
      if (page === 1 && response.versions.length > 0) {
        setLatestVersion(response.versions[0].version);
      }
    } catch {
      toast.error("Failed to load versions");
    } finally {
      setLoading(false);
    }
  }, [workflowId, page, limit]);

  const handleCompare = (version: WorkflowVersion) => {
    // Navigate to compare page with this version and the latest version
    router.push(
      `/dashboard/workflow/${workflowId}/compare?v1=${version.version}&v2=${latestVersion}`
    );
  };

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleCreateVersion = async (data: {
    name?: string;
    tag?: string;
    description?: string;
  }) => {
    setActionLoading(true);
    try {
      await createWorkflowVersion(workflowId, data);
      toast.success("Version created successfully");
      setCreateDialogOpen(false);
      setPage(1); // Go to first page to see new version
      loadVersions();
    } catch {
      toast.error("Failed to create version");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreClick = (version: WorkflowVersion) => {
    setSelectedVersion(version);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!selectedVersion) return;

    setActionLoading(true);
    try {
      const response = await restoreWorkflowVersion(
        workflowId,
        selectedVersion.version
      );
      toast.success(`Restored to version ${selectedVersion.version}`);
      setRestoreDialogOpen(false);

      // Notify parent to update canvas
      if (onRestore && response.workflow) {
        onRestore(response.workflow.nodes, response.workflow.edges);
      }

      loadVersions();
    } catch {
      toast.error("Failed to restore version");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && versions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-medium">Version History</h3>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Save Version
        </Button>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No versions yet. Click &quot;Save Version&quot; to create one.
          </div>
        ) : (
          versions.map((version, index) => (
            <VersionItem
              key={version.id}
              version={version}
              isCurrent={page === 1 && index === 0}
              latestVersion={latestVersion}
              onRestore={() => handleRestoreClick(version)}
              onCompare={() => handleCompare(version)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Create Version Dialog */}
      <CreateVersionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onConfirm={handleCreateVersion}
        loading={actionLoading}
      />

      {/* Restore Confirm Dialog */}
      <RestoreConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        version={selectedVersion}
        onConfirm={handleRestoreConfirm}
        loading={actionLoading}
      />
    </div>
  );
}
