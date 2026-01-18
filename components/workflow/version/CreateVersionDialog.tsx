"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    name?: string;
    tag?: string;
    description?: string;
  }) => void;
  loading: boolean;
}

export default function CreateVersionDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: CreateVersionDialogProps) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      name: name || undefined,
      tag: tag || undefined,
      description: description || undefined,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName("");
      setTag("");
      setDescription("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Save Version</DialogTitle>
            <DialogDescription>
              Create a snapshot of the current workflow state. All fields are
              optional.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="version-name">Name</Label>
              <Input
                id="version-name"
                placeholder="e.g., Production release"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="version-tag">Tag</Label>
              <Input
                id="version-tag"
                placeholder="e.g., v1.0"
                value={tag}
                onChange={e => setTag(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="version-description">Description</Label>
              <Textarea
                id="version-description"
                placeholder="Describe what changed in this version..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Version
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
