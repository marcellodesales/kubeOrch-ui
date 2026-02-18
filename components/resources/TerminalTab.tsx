"use client";

import { useTerminal } from "@/lib/hooks/useTerminal";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Circle,
  Terminal as TerminalIcon,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Download,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamic import for xterm to avoid SSR issues
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalTabProps {
  resourceId: string;
  resourceType: string;
  containers?: Array<{ name: string }>;
}

export function TerminalTab({
  resourceId,
  resourceType,
  containers = [],
}: TerminalTabProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [container, setContainer] = useState<string>(containers[0]?.name || "");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const { isConnected, error, metadata, sendInput, sendResize, reconnect } =
    useTerminal(
      resourceId,
      container,
      "/bin/sh",
      resourceType === "Pod",
      data => {
        // onOutput callback
        if (xtermRef.current) {
          xtermRef.current.write(data);
        }
      },
      message => {
        // onClose callback
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[33m○ ${message}\x1b[0m`);
        }
      }
    );

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current || resourceType !== "Pod") return;

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#ffffff",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#e5e5e5",
      },
      rows: 24,
      cols: 80,
    });

    // Add fit addon for responsive sizing
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    // Open terminal in DOM
    term.open(terminalRef.current);

    // Fit to container
    setTimeout(() => {
      fitAddon.fit();
    }, 0);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln("\x1b[36m╔═══════════════════════════════════════╗\x1b[0m");
    term.writeln("\x1b[36m║   KubeOrch Terminal Session           ║\x1b[0m");
    term.writeln("\x1b[36m╚═══════════════════════════════════════╝\x1b[0m");
    term.writeln("");

    // Handle user input
    term.onData(data => {
      sendInput(data);
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      sendResize(term.rows, term.cols);
    };

    // Debounce resize events
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimeout);
      term.dispose();
    };
  }, [resourceType, sendInput, sendResize]);

  // Display metadata when connected
  useEffect(() => {
    if (metadata && xtermRef.current) {
      xtermRef.current.writeln(`\x1b[32m✓ Connected to terminal\x1b[0m`);
      xtermRef.current.writeln(`\x1b[36mPod: ${metadata.pod}\x1b[0m`);
      xtermRef.current.writeln(
        `\x1b[36mContainer: ${metadata.container}\x1b[0m`
      );
      xtermRef.current.writeln(
        `\x1b[36mNamespace: ${metadata.namespace}\x1b[0m`
      );
      xtermRef.current.writeln(
        `\x1b[36mCluster: ${metadata.cluster}\x1b[0m\r\n`
      );
    }
  }, [metadata]);

  // Display errors
  useEffect(() => {
    if (error && xtermRef.current) {
      xtermRef.current.writeln(`\r\n\x1b[31m✗ Error: ${error}\x1b[0m`);
    }
  }, [error]);

  const handleReconnect = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
    reconnect();
  };

  const handleClearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      toast.success("Terminal cleared");
    }
  };

  const handleCopySelection = () => {
    if (xtermRef.current) {
      const selection = xtermRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
        toast.success("Copied to clipboard");
      } else {
        toast.info("No text selected");
      }
    }
  };

  const handleDownloadLogs = () => {
    if (xtermRef.current) {
      const buffer = xtermRef.current.buffer.active;
      let content = "";
      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i);
        if (line) {
          content += line.translateToString() + "\n";
        }
      }

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `terminal-${resourceId}-${new Date().toISOString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Terminal output downloaded");
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }, 100);
  };

  const handleContainerChange = (value: string) => {
    setContainer(value);
  };

  if (resourceType !== "Pod") {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center space-y-2">
          <TerminalIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-lg">Only pods support terminal access</p>
          <p className="text-sm">
            {resourceType === "Deployment" || resourceType === "StatefulSet"
              ? 'Check the "Pods" tab to access terminals in individual pods'
              : "This resource type does not support interactive shells"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col border rounded-lg overflow-hidden bg-background ${
        isFullscreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-full"
      }`}
    >
      {/* Header with Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          {/* Container Selector */}
          {containers.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Container:</span>
              <Select value={container} onValueChange={handleContainerChange}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {containers.map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearTerminal}
            title="Clear Terminal"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopySelection}
            title="Copy Selection"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDownloadLogs}
            title="Download Terminal Output"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReconnect}
            title="Reconnect"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden bg-[#1e1e1e]"
        style={{ minHeight: "500px" }}
      />

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          {isConnected ? (
            <>
              <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500 animate-pulse" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <Circle className="w-1.5 h-1.5 fill-gray-500 text-gray-500" />
              <span>Disconnected</span>
            </>
          )}
          {metadata && (
            <>
              <span>•</span>
              <span>{metadata.container}</span>
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
