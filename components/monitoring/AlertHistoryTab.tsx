"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAlertStore } from "@/stores/AlertStore";
import { SeverityBadge } from "./SeverityBadge";
import { AlertStatusBadge } from "./AlertStatusBadge";
import { CheckCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  cluster: "Cluster",
  workflow: "Workflow",
  resource: "Resource",
};

export function AlertHistoryTab() {
  const {
    events,
    eventsTotal,
    fetchEvents,
    acknowledgeEvent,
    resolveEvent,
    isLoading,
  } = useAlertStore();

  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchEvents({
      severity: severity === "all" ? undefined : severity,
      status: status === "all" ? undefined : status,
      type: type === "all" ? undefined : type,
      page,
      limit,
    });
  }, [fetchEvents, severity, status, type, page]);

  const totalPages = Math.ceil(eventsTotal / limit);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeEvent(id);
    } catch {
      toast.error("Failed to acknowledge event");
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveEvent(id);
    } catch {
      toast.error("Failed to resolve event");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={severity}
          onValueChange={v => {
            setSeverity(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={v => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="firing">Firing</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={type}
          onValueChange={v => {
            setType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cluster">Cluster</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="resource">Resource</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          {eventsTotal} event{eventsTotal !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No events found</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Alert</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell>
                    <SeverityBadge severity={event.severity} />
                  </TableCell>
                  <TableCell className="font-medium max-w-[160px] truncate">
                    {event.ruleName}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {event.message}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[event.ruleType] || event.ruleType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AlertStatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(event.firedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {event.status === "firing" && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Acknowledge"
                          onClick={() => handleAcknowledge(event.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Resolve"
                          onClick={() => handleResolve(event.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
