"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Wrench,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { YAMLEditor } from "./YAMLEditor";
import { toast } from "sonner";
import api from "@/lib/api";
import yaml from "js-yaml";

interface DiagnosticCheck {
  name: string;
  status: "pass" | "warning" | "error";
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  fixType?: string;
}

interface DiagnosticResult {
  overallStatus: "healthy" | "warning" | "error";
  serviceName: string;
  namespace: string;
  checks: DiagnosticCheck[];
  timestamp: string;
}

interface FixTemplate {
  name: string;
  description: string;
  yaml: string;
  applyMethod: string;
  fixType: string;
}

interface ServiceDiagnosticsPanelProps {
  workflowId: string;
  nodeId: string;
  serviceStatus?: {
    state?: string;
    externalIP?: string;
    clusterIP?: string;
  };
}

export function ServiceDiagnosticsPanel({
  workflowId,
  nodeId,
  serviceStatus,
}: ServiceDiagnosticsPanelProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFix, setSelectedFix] = useState<string | null>(null);
  const [fixTemplate, setFixTemplate] = useState<FixTemplate | null>(null);
  const [editableYAML, setEditableYAML] = useState<string>("");
  const [fixMode, setFixMode] = useState<"auto" | "manual">("auto");
  const [isApplying, setIsApplying] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [yamlError, setYamlError] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<DiagnosticResult>(
        `/workflows/${workflowId}/nodes/${nodeId}/diagnostics`
      );
      setDiagnostics(data);

      // Auto-select first fixable issue
      const firstFixable = data.checks.find(
        (c: DiagnosticCheck) => c.autoFixable && c.status !== "pass"
      );
      if (firstFixable?.fixType) {
        setSelectedFix(firstFixable.fixType);
      }
    } catch {
      toast.error("Failed to load diagnostics");
    } finally {
      setIsLoading(false);
    }
  }, [workflowId, nodeId]);

  const fetchFixTemplate = useCallback(
    async (fixType: string) => {
      setIsLoadingTemplate(true);
      try {
        const { data } = await api.get<FixTemplate>(
          `/workflows/${workflowId}/nodes/${nodeId}/fix-template/${fixType}`
        );
        setFixTemplate(data);
        setEditableYAML(data.yaml);
      } catch {
        toast.error("Failed to load fix template");
      } finally {
        setIsLoadingTemplate(false);
      }
    },
    [workflowId, nodeId]
  );

  // Validate YAML syntax
  const validateYAML = useCallback((yamlString: string) => {
    try {
      yaml.load(yamlString);
      setYamlError(null);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid YAML syntax";
      setYamlError(message);
      return false;
    }
  }, []);

  // Handle YAML changes with validation
  const handleYAMLChange = useCallback(
    (value: string) => {
      setEditableYAML(value);
      if (fixMode === "manual") {
        validateYAML(value);
      }
    },
    [fixMode, validateYAML]
  );

  const applyFix = async () => {
    if (!selectedFix) return;

    // Validate YAML before applying (manual mode only)
    if (fixMode === "manual" && !validateYAML(editableYAML)) {
      toast.error("Please fix YAML syntax errors before applying");
      return;
    }

    setIsApplying(true);
    try {
      const yamlToApply =
        fixMode === "manual" ? editableYAML : fixTemplate?.yaml;

      const response = await api.post(
        `/workflows/${workflowId}/nodes/${nodeId}/fix`,
        {
          fixType: selectedFix,
          yaml: yamlToApply,
          mode: fixMode,
        }
      );

      // Show detailed success message
      const fixName = fixTemplate?.name || "Fix";
      toast.success(
        <div>
          <div className="font-medium">{fixName} applied successfully</div>
          {response.data?.message && (
            <div className="text-xs text-muted-foreground mt-1">
              {response.data.message}
            </div>
          )}
        </div>
      );

      // Re-run diagnostics after fix
      setTimeout(() => {
        fetchDiagnostics();
      }, 2000);
    } catch (error: any) {
      // Extract detailed error message
      const errorMessage =
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to apply fix";

      toast.error(
        <div>
          <div className="font-medium">Failed to apply fix</div>
          <div className="text-xs text-muted-foreground mt-1">
            {errorMessage}
          </div>
        </div>,
        { duration: 5000 }
      );
    } finally {
      setIsApplying(false);
    }
  };

  // Fetch diagnostics only on mount - SSE updates drive visibility via serviceStatus prop
  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  useEffect(() => {
    if (selectedFix) {
      fetchFixTemplate(selectedFix);
    }
  }, [selectedFix, fetchFixTemplate]);

  // Don't render if service status is healthy (from real-time SSE updates)
  // This provides immediate feedback without waiting for diagnostics API
  if (serviceStatus?.state === "healthy") {
    return null;
  }

  // Don't render if diagnostics show healthy
  if (!diagnostics || diagnostics.overallStatus === "healthy") {
    return null;
  }

  const failedChecks = diagnostics.checks.filter(
    c => c.status === "error" || c.status === "warning"
  );
  const fixableChecks = failedChecks.filter(c => c.autoFixable);

  return (
    <div className="space-y-3">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="border border-yellow-500/50 rounded-md bg-yellow-500/5">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-yellow-500/10 transition-colors">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  Issues Detected ({failedChecks.length})
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-3">
              {/* Mode Toggle - Always visible when there are fixable issues */}
              {fixableChecks.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {fixMode === "auto" ? "Quick Fix" : "Diagnostics"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={fixMode === "auto"}
                      onCheckedChange={checked =>
                        setFixMode(checked ? "auto" : "manual")
                      }
                    />
                    <span className="text-xs text-muted-foreground">Auto</span>
                  </div>
                </div>
              )}

              {/* Diagnostic Checks - Only show in Manual mode */}
              {fixMode === "manual" && (
                <div className="space-y-2">
                  {diagnostics.checks.map(check => (
                    <div
                      key={check.name}
                      className={`flex items-start gap-2 p-2 rounded-md text-sm ${
                        check.status === "pass"
                          ? "bg-green-500/10"
                          : check.status === "warning"
                            ? "bg-yellow-500/10"
                            : "bg-red-500/10"
                      }`}
                    >
                      {check.status === "pass" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle
                          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            check.status === "warning"
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {check.message}
                          </span>
                          {check.autoFixable && (
                            <Badge
                              variant="outline"
                              className="text-xs flex-shrink-0"
                            >
                              <Wrench className="h-2.5 w-2.5 mr-1" />
                              Fixable
                            </Badge>
                          )}
                        </div>
                        {check.suggestion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {check.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-Fix Section */}
              {fixableChecks.length > 0 && (
                <>
                  {fixMode === "manual" && <Separator />}
                  <div className="space-y-3">
                    {/* Fix type selector (if multiple) */}
                    {fixableChecks.length > 1 && (
                      <div className="flex flex-wrap gap-1">
                        {fixableChecks.map(check => (
                          <Button
                            key={check.fixType}
                            size="sm"
                            variant={
                              selectedFix === check.fixType
                                ? "default"
                                : "outline"
                            }
                            className="h-7 text-xs"
                            onClick={() =>
                              setSelectedFix(check.fixType || null)
                            }
                          >
                            {check.fixType}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Fix Template Info */}
                    {fixTemplate && (
                      <div className="space-y-2">
                        {/* YAML Editor - only in Manual mode */}
                        {fixMode === "manual" && (
                          <div className="space-y-2">
                            <div className="border rounded-md overflow-hidden">
                              {isLoadingTemplate ? (
                                <div className="h-[200px] flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                              ) : (
                                <YAMLEditor
                                  value={editableYAML}
                                  onChange={handleYAMLChange}
                                  height="200px"
                                />
                              )}
                            </div>

                            {/* YAML Validation Error */}
                            {yamlError && (
                              <div className="flex items-start gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-red-500">
                                    Invalid YAML Syntax
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {yamlError}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={applyFix}
                      disabled={
                        isApplying ||
                        !selectedFix ||
                        !fixTemplate ||
                        (fixMode === "manual" && !!yamlError)
                      }
                      className="w-full"
                      size="sm"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Applying Fix...
                        </>
                      ) : (
                        <>
                          <Wrench className="h-4 w-4 mr-2" />
                          Apply Fix
                          {fixMode === "auto" && " (Quick)"}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
