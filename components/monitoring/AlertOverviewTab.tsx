"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlertStore } from "@/stores/AlertStore";
import { SeverityBadge } from "./SeverityBadge";
import { AlertStatusBadge } from "./AlertStatusBadge";
import {
  Bell,
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export function AlertOverviewTab() {
  const {
    overview,
    events,
    fetchOverview,
    fetchEvents,
    isLoading,
    fireTestAlert,
  } = useAlertStore();
  const [isFiringTest, setIsFiringTest] = useState(false);

  const handleFireTest = async () => {
    setIsFiringTest(true);
    try {
      await fireTestAlert();
    } catch {
      toast.error("Failed to fire test alert");
    } finally {
      setIsFiringTest(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchEvents({ limit: 10 });
  }, [fetchOverview, fetchEvents]);

  if (!overview && isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const stats = overview || {
    activeAlerts: 0,
    totalRules: 0,
    enabledRules: 0,
    severityBreakdown: { critical: 0, warning: 0, info: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={
            stats.activeAlerts > 0
              ? "border-red-200 dark:border-red-800"
              : undefined
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell
              className={`h-4 w-4 ${
                stats.activeAlerts > 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.activeAlerts > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-foreground"
              }`}
            >
              {stats.activeAlerts}
            </div>
            <div className="mt-2 flex gap-2">
              {stats.severityBreakdown.critical > 0 && (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-red-200 dark:border-red-800"
                >
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {stats.severityBreakdown.critical} critical
                </Badge>
              )}
              {stats.severityBreakdown.warning > 0 && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {stats.severityBreakdown.warning} warning
                </Badge>
              )}
              {stats.severityBreakdown.info > 0 && (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                  <Info className="mr-1 h-3 w-3" />
                  {stats.severityBreakdown.info} info
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.enabledRules} enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enabledRules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats.totalRules} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest alert activity</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFireTest}
            disabled={isFiringTest}
          >
            <Zap className="mr-1 h-3.5 w-3.5" />
            {isFiringTest ? "Firing..." : "Fire Test Alert"}
          </Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No recent alert events
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 10).map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SeverityBadge severity={event.severity} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.ruleName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <AlertStatusBadge status={event.status} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(event.firedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
