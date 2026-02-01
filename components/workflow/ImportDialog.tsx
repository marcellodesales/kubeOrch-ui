"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Link,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Box,
  Globe,
  Key,
  HardDrive,
  Database,
  FileCode,
  Layers,
} from "lucide-react";
import {
  ImportAnalysis,
  uploadComposeFile,
  analyzeImport,
  detectSourceFromUrl,
} from "@/lib/services/import";

const nodeTypeIcons: Record<string, React.ReactNode> = {
  deployment: <Box className="h-4 w-4" />,
  service: <Globe className="h-4 w-4" />,
  configmap: <FileCode className="h-4 w-4" />,
  secret: <Key className="h-4 w-4" />,
  persistentvolumeclaim: <HardDrive className="h-4 w-4" />,
  statefulset: <Database className="h-4 w-4" />,
  ingress: <Layers className="h-4 w-4" />,
};

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (analysis: ImportAnalysis) => void;
}

interface ImportedItem {
  id: string;
  source: string;
  analysis: ImportAnalysis;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<ImportedItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importUrl, setImportUrl] = useState("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setImportError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".yml") || file.name.endsWith(".yaml")) {
        setSelectedFile(file);
        analyzeFile(file);
      } else {
        setImportError("Please upload a .yml or .yaml file");
      }
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImportError(null);
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.name.endsWith(".yml") || file.name.endsWith(".yaml")) {
          setSelectedFile(file);
          analyzeFile(file);
        } else {
          setImportError("Please upload a .yml or .yaml file");
        }
      }
    },
    []
  );

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setImportError(null);

    try {
      const result = await uploadComposeFile(file);
      setAnalyses(prev => [
        ...prev,
        {
          id: `file-${Date.now()}`,
          source: file.name,
          analysis: result.analysis,
        },
      ]);
      setSelectedFile(null);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const message =
        axiosErr?.response?.data?.error ||
        axiosErr?.message ||
        "Failed to analyze file";
      setImportError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!importUrl) return;

    setIsAnalyzing(true);
    setImportError(null);
    setSelectedFile(null);

    try {
      const source = detectSourceFromUrl(importUrl);
      const result = await analyzeImport({
        source,
        url: importUrl,
        branch: "main",
      });

      const urlParts = importUrl.split("/");
      const sourceName =
        urlParts[urlParts.length - 1] ||
        urlParts[urlParts.length - 2] ||
        importUrl;

      if (result.analysis) {
        const analysis = result.analysis;
        setAnalyses(prev => [
          ...prev,
          {
            id: `url-${Date.now()}`,
            source: sourceName,
            analysis,
          },
        ]);
      }
      setImportUrl("");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const message =
        axiosErr?.response?.data?.error ||
        axiosErr?.message ||
        "Failed to analyze URL";
      setImportError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImport = useCallback((id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleImportAll = () => {
    if (analyses.length === 0) return;

    // Merge all analyses
    const mergedAnalysis: ImportAnalysis = {
      detectedType: analyses.map(a => a.analysis.detectedType).join(", "),
      services: analyses.flatMap(a => a.analysis.services),
      warnings: analyses.flatMap(a => a.analysis.warnings || []),
      suggestedNodes: analyses.flatMap(a => a.analysis.suggestedNodes),
      suggestedEdges: analyses.flatMap(a => a.analysis.suggestedEdges),
      layoutPositions: analyses.reduce(
        (acc, a) => ({ ...acc, ...a.analysis.layoutPositions }),
        {}
      ),
    };

    onImport(mergedAnalysis);
    handleClose();
  };

  const handleClose = () => {
    setAnalyses([]);
    setImportError(null);
    setSelectedFile(null);
    setImportUrl("");
    setIsAnalyzing(false);
    onClose();
  };

  // Count nodes by type
  const nodeCountsByType = analyses.reduce(
    (acc, { analysis }) => {
      analysis.suggestedNodes.forEach(node => {
        acc[node.type] = (acc[node.type] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const totalNodes = Object.values(nodeCountsByType).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Configuration</DialogTitle>
          <DialogDescription>
            Import from docker-compose files or Git repositories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* List of imported sources */}
          {analyses.length > 0 && (
            <div className="space-y-2">
              {analyses.map(({ id, source, analysis }) => (
                <div
                  key={id}
                  className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {source}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {analysis.services.length} services
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImport(id)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Summary */}
              {totalNodes > 0 && (
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground px-1">
                  <span className="text-xs font-medium">Total:</span>
                  {Object.entries(nodeCountsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-1">
                      {nodeTypeIcons[type] || <Box className="h-3 w-3" />}
                      <span className="text-xs">
                        {count} {type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          <div
            className={`
              border rounded-lg p-4 text-center cursor-pointer transition-colors
              ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
              }
              ${isAnalyzing && selectedFile ? "pointer-events-none opacity-60" : ""}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() =>
              document.getElementById("import-file-input")?.click()
            }
          >
            <input
              id="import-file-input"
              type="file"
              accept=".yml,.yaml"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isAnalyzing && selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Analyzing {selectedFile.name}...
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {analyses.length > 0
                    ? "Add another YAML file"
                    : "Drop YAML file here or click to browse"}
                </span>
              </div>
            )}
          </div>

          {/* Or divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* URL Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  analyses.length > 0
                    ? "Add another GitHub repository URL"
                    : "Paste GitHub repository URL"
                }
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                className="pl-9"
                disabled={isAnalyzing && !selectedFile}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAnalyzeUrl}
              disabled={!importUrl || isAnalyzing}
            >
              {isAnalyzing && !selectedFile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          </div>

          {importError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {importError}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleImportAll} disabled={analyses.length === 0}>
              Import {analyses.length > 0 && `(${totalNodes} nodes)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
