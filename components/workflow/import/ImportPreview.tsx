"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Box,
  Database,
  Globe,
  HardDrive,
  Key,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  FileCode,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  ImportAnalysis,
  applyImport,
  createWorkflowFromImport,
} from "@/lib/services/import";
import { WorkflowNode } from "@/lib/services/workflow";

interface ImportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: ImportAnalysis;
  workflowId?: string;
  workflowName?: string;
  clusterId?: string;
  namespace: string;
  onBack: () => void;
  onImportComplete?: (workflowId: string) => void;
}

const nodeTypeIcons: Record<string, React.ReactNode> = {
  deployment: <Box className="h-4 w-4" />,
  service: <Globe className="h-4 w-4" />,
  configmap: <FileCode className="h-4 w-4" />,
  secret: <Key className="h-4 w-4" />,
  persistentvolumeclaim: <HardDrive className="h-4 w-4" />,
  statefulset: <Database className="h-4 w-4" />,
  ingress: <Layers className="h-4 w-4" />,
};

const nodeTypeColors: Record<string, string> = {
  deployment: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  service: "bg-green-500/10 text-green-500 border-green-500/20",
  configmap: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  secret: "bg-red-500/10 text-red-500 border-red-500/20",
  persistentvolumeclaim:
    "bg-purple-500/10 text-purple-500 border-purple-500/20",
  statefulset: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  ingress: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

export function ImportPreview({
  open,
  onOpenChange,
  analysis,
  workflowId,
  workflowName,
  clusterId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  namespace,
  onBack,
  onImportComplete,
}: ImportPreviewProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState(
    workflowName || "Imported Workflow"
  );

  const isNewWorkflow = !workflowId;

  // Group nodes by type
  const nodesByType = analysis.suggestedNodes.reduce<
    Record<string, WorkflowNode[]>
  >((acc, node) => {
    const type = node.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(node);
    return acc;
  }, {});

  const handleImport = async () => {
    setIsImporting(true);

    try {
      if (isNewWorkflow) {
        if (!clusterId) {
          toast.error("Please select a cluster first");
          setIsImporting(false);
          return;
        }

        const result = await createWorkflowFromImport({
          name: newWorkflowName,
          clusterId,
          analysis,
        });

        toast.success("Workflow created successfully");

        if (onImportComplete) {
          onImportComplete(result.workflow.id);
        } else {
          router.push(`/dashboard/workflow/${result.workflow.id}`);
        }
      } else {
        await applyImport({
          workflowId: workflowId!,
          nodes: analysis.suggestedNodes,
          edges: analysis.suggestedEdges,
          positions: analysis.layoutPositions,
        });

        toast.success("Import applied successfully");

        if (onImportComplete) {
          onImportComplete(workflowId!);
        }
      }

      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Import Preview
          </DialogTitle>
          <DialogDescription>
            Review the detected services and nodes before importing
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 pr-4">
            {/* Detection summary */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="text-sm">
                {analysis.detectedType}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {analysis.services.length} service(s) detected
              </span>
              <span className="text-sm text-muted-foreground">
                {analysis.suggestedNodes.length} node(s) to create
              </span>
              <span className="text-sm text-muted-foreground">
                {analysis.suggestedEdges.length} connection(s)
              </span>
            </div>

            {/* Warnings */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Warnings
                </h4>
                <div className="space-y-1">
                  {analysis.warnings.map((warning, index) => (
                    <Alert
                      key={index}
                      variant="default"
                      className="py-2 bg-amber-500/5 border-amber-500/20"
                    >
                      <AlertDescription className="text-sm text-amber-600 dark:text-amber-400">
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* New workflow name input */}
            {isNewWorkflow && (
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  value={newWorkflowName}
                  onChange={e => setNewWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                />
              </div>
            )}

            <Separator />

            {/* Nodes by type */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Nodes to Create</h4>

              {Object.entries(nodesByType).map(([type, nodes]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded ${
                        nodeTypeColors[type] || "bg-gray-500/10"
                      }`}
                    >
                      {nodeTypeIcons[type] || <Box className="h-4 w-4" />}
                    </span>
                    <span className="text-sm font-medium capitalize">
                      {type === "persistentvolumeclaim" ? "PVC" : type}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {nodes.length}
                    </Badge>
                  </div>

                  <div className="grid gap-2 pl-8">
                    {nodes.map(node => (
                      <div
                        key={node.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm"
                      >
                        <span className="font-mono">
                          {((node.data as Record<string, unknown>)
                            ?.name as string) || node.id}
                        </span>
                        {type === "deployment" &&
                          !!(node.data as Record<string, unknown>)?.image && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {String(
                                (node.data as Record<string, unknown>).image
                              )}
                            </span>
                          )}
                        {type === "service" &&
                          !!(node.data as Record<string, unknown>)
                            ?.serviceType && (
                            <Badge variant="outline" className="text-xs">
                              {String(
                                (node.data as Record<string, unknown>)
                                  .serviceType
                              )}
                            </Badge>
                          )}
                        {type === "persistentvolumeclaim" &&
                          !!(node.data as Record<string, unknown>)?.storage && (
                            <Badge variant="outline" className="text-xs">
                              {String(
                                (node.data as Record<string, unknown>).storage
                              )}
                            </Badge>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Detected services summary */}
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Original Services</h4>
              <div className="grid gap-2">
                {analysis.services.map(service => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3 rounded-md border bg-card"
                  >
                    <div>
                      <span className="font-medium">{service.name}</span>
                      {service.image && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {service.image}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {service.ports && service.ports.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {service.ports.map(p => p.containerPort).join(", ")}
                        </Badge>
                      )}
                      {service.environment &&
                        Object.keys(service.environment).length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {Object.keys(service.environment).length} env
                          </Badge>
                        )}
                      {service.volumes && service.volumes.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {service.volumes.length} vol
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onBack} disabled={isImporting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : isNewWorkflow ? (
              "Create Workflow"
            ) : (
              "Apply to Workflow"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
