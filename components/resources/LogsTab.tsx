"use client";

import { useLogStream } from "@/lib/hooks/useLogStream";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Circle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogsTabProps {
  resourceId: string;
  resourceType: string;
}

const MAX_LOG_LINES = 5000;

export function LogsTab({ resourceId, resourceType }: LogsTabProps) {
  const [tailLines, setTailLines] = useState<string>("100");
  const { logs, isConnected, error, metadata, reconnect, clearLogs } =
    useLogStream(resourceId, resourceType === "Pod", true, parseInt(tailLines));
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleTailLinesChange = (value: string) => {
    clearLogs(); // Clear existing logs before fetching new ones
    setTailLines(value);
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const downloadLogs = () => {
    const content = logs.map(log => log.raw).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${metadata?.pod || resourceId}-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReconnect = () => {
    reconnect();
  };

  if (resourceType !== "Pod") {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg">Only pods have logs</p>
          <p className="text-sm">
            {resourceType === "Deployment" || resourceType === "StatefulSet"
              ? 'Check the "Pods" tab to view logs from individual pods'
              : "This resource type does not generate logs"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      {/* Header with Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          {/* Tail Lines Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tail:</span>
            <Select value={tailLines} onValueChange={handleTailLinesChange}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
                <SelectItem value="1000">Last 1000</SelectItem>
                <SelectItem value="5000">Last 5000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleReconnect}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={downloadLogs}
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Warning when approaching limit */}
      {logs.length >= MAX_LOG_LINES && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ Log buffer full ({MAX_LOG_LINES} lines). Oldest logs are being
            discarded to maintain performance.
          </p>
        </div>
      )}

      {/* Logs Terminal */}
      <div className="flex-1 overflow-auto bg-black">
        <div className="font-mono text-xs text-green-400 p-4">
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-center py-10">
              {isConnected ? "Waiting for logs..." : "Connecting to pod..."}
            </div>
          ) : (
            <>
              {logs.map(log => (
                <div
                  key={log.id}
                  className="hover:bg-white/5 px-2 py-0.5 leading-relaxed border-l-2 border-transparent hover:border-green-500"
                >
                  {log.timestamp && (
                    <span className="text-muted-foreground">
                      {log.timestamp}{" "}
                    </span>
                  )}
                  <span className="text-green-400">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>
            {logs.length.toLocaleString()} / {MAX_LOG_LINES.toLocaleString()}{" "}
            lines
          </span>
          {isConnected && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500 animate-pulse" />
                Live streaming
              </span>
            </>
          )}
        </div>
        <div className="text-muted-foreground">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
