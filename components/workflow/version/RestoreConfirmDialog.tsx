"use client";

import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { WorkflowVersion } from "@/lib/services/workflow";

interface RestoreConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: WorkflowVersion | null;
  onConfirm: () => void;
  loading: boolean;
}

export default function RestoreConfirmDialog({
  open,
  onOpenChange,
  version,
  onConfirm,
  loading,
}: RestoreConfirmDialogProps) {
  if (!version) return null;

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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Restore Version {version.version}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will restore the workflow to the state from{" "}
              <strong>{formatDate(version.created_at)}</strong>.
            </p>
            <p>
              A new version will be created with the restored content. Your
              current workflow state will be preserved as the previous version.
            </p>
            {version.name && (
              <p className="text-sm">
                Version name: <strong>{version.name}</strong>
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Restore
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
