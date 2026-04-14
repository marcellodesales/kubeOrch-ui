"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Upload,
  GitBranch,
  Link,
  Loader2,
  FileCode,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Terminal,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { toast } from "sonner";
import {
  ImportAnalysis,
  analyzeImport,
  uploadComposeFile,
  isValidGitUrl,
  detectSourceFromUrl,
} from "@/lib/services/import";
import { useImportStream } from "@/lib/hooks/useImportStream";
import { ImportPreview } from "./ImportPreview";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId?: string;
  workflowName?: string;
  clusterId?: string;
  onImportComplete?: (workflowId: string) => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  workflowId,
  workflowName,
  clusterId,
  onImportComplete,
}: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fileContent, setFileContent] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fileName, setFileName] = useState<string | null>(null);

  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // URL state
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("main");

  // Namespace state
  const [namespace, setNamespace] = useState("default");

  // Async import state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // SSE stream for async imports
  const {
    session,
    logs,
    analysis: streamAnalysis,
    isConnected,
    error: streamError,
  } = useImportStream(sessionId || "", !!sessionId);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current && logs.length > 0) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Handle stream completion
  useEffect(() => {
    if (streamAnalysis && sessionId) {
      setAnalysis(streamAnalysis as unknown as ImportAnalysis);
      setSessionId(null);
      setIsAnalyzing(false);
    }
  }, [streamAnalysis, sessionId]);

  // Handle stream error
  useEffect(() => {
    if (session?.status === "failed" && sessionId) {
      setError(session.errorMessage || "Import failed");
      setSessionId(null);
      setIsAnalyzing(false);
    }
  }, [session, sessionId]);

  const resetState = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setSelectedFile(null);
    setFileContent(null);
    setFileName(null);
    setUrl("");
    setBranch("main");
    setIsAnalyzing(false);
    setSessionId(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".yml") || file.name.endsWith(".yaml")) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("Please upload a .yml or .yaml file");
      }
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.name.endsWith(".yml") || file.name.endsWith(".yaml")) {
          setSelectedFile(file);
          setError(null);
        } else {
          setError("Please upload a .yml or .yaml file");
        }
      }
    },
    []
  );

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await uploadComposeFile(selectedFile, namespace);
      setAnalysis(result.analysis);
      setFileContent(result.fileContent);
      setFileName(result.fileName);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to analyze file";
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!url) return;

    if (!isValidGitUrl(url)) {
      setError("Please enter a valid GitHub, GitLab, or Git repository URL");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSessionId(null);

    try {
      const source = detectSourceFromUrl(url);
      const result = await analyzeImport({
        source,
        url,
        branch,
        namespace,
        workflowId,
      });

      // Check if this is an async response
      if (result.async && result.sessionId) {
        // Async import - start streaming
        setSessionId(result.sessionId);
        toast.info("Cloning repository...");
        // Keep isAnalyzing true - will be set to false when stream completes
      } else if (result.analysis) {
        // Sync response - immediate result
        setAnalysis(result.analysis);
        setIsAnalyzing(false);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to analyze repository";
      setError(message);
      toast.error(message);
      setIsAnalyzing(false);
    }
  };

  const handleBackToInput = () => {
    setAnalysis(null);
    setError(null);
  };

  // If we have an analysis, show the preview
  if (analysis) {
    return (
      <ImportPreview
        open={open}
        onOpenChange={handleClose}
        analysis={analysis}
        workflowId={workflowId}
        workflowName={workflowName}
        clusterId={clusterId}
        namespace={namespace}
        onBack={handleBackToInput}
        onImportComplete={onImportComplete}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Workflow
          </DialogTitle>
          <DialogDescription>
            Import from a docker-compose file or Git repository
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as "file" | "url")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <GithubIcon className="h-4 w-4" />
              Git URL
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Namespace selector (common for both tabs) */}
            <div className="space-y-2">
              <Label htmlFor="namespace">Target Namespace</Label>
              <Select value={namespace} onValueChange={setNamespace}>
                <SelectTrigger id="namespace">
                  <SelectValue placeholder="Select namespace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">default</SelectItem>
                  <SelectItem value="production">production</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                  <SelectItem value="development">development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="file" className="mt-0 space-y-4">
              {/* Drag and drop zone */}
              <div
                role="button"
                tabIndex={0}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center
                  transition-colors cursor-pointer
                  ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ")
                    document.getElementById("file-input")?.click();
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".yml,.yaml"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />

                {selectedFile ? (
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-foreground">
                      Drop your docker-compose.yml here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleAnalyzeFile}
                disabled={!selectedFile || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileCode className="mr-2 h-4 w-4" />
                    Analyze File
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="url" className="mt-0 space-y-4">
              {/* URL input */}
              <div className="space-y-2">
                <Label htmlFor="repo-url">Repository URL</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="repo-url"
                    placeholder="https://github.com/user/repo"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Branch input */}
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <div className="relative">
                  <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="branch"
                    placeholder="main"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                onClick={handleAnalyzeUrl}
                disabled={!url || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Repository...
                  </>
                ) : (
                  <>
                    <GithubIcon className="mr-2 h-4 w-4" />
                    Analyze Repository
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Supports GitHub, GitLab, and generic Git repositories
              </p>
            </TabsContent>
          </div>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Streaming logs panel for async imports */}
        {sessionId && (
          <div className="mt-4 space-y-3">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {session?.currentStage || "Initializing..."}
                </span>
                <span className="font-medium">{session?.progress || 0}%</span>
              </div>
              <Progress value={session?.progress || 0} className="h-2" />
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              {isConnected ? "Live updates connected" : "Connecting..."}
            </div>

            {/* Collapsible logs panel */}
            <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Import Logs ({logs.length} lines)
                  </span>
                  {logsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 h-[200px] overflow-auto bg-zinc-950 rounded-lg p-3 font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Waiting for logs...
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {logs.map((log, index) => (
                        <div key={index} className="flex">
                          <span className="text-zinc-600 w-16 flex-shrink-0">
                            [{log.stage}]
                          </span>
                          <span
                            className={`flex-1 ${
                              log.level === "error"
                                ? "text-red-500"
                                : log.level === "warn"
                                  ? "text-yellow-500"
                                  : "text-zinc-400"
                            }`}
                          >
                            {log.message}
                          </span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {streamError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{streamError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
