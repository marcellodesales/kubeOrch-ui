"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Construction,
} from "lucide-react";

const placeholderMetrics = [
  {
    title: "CPU Usage",
    value: "--",
    icon: Cpu,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    title: "Memory Usage",
    value: "--",
    icon: MemoryStick,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    title: "Disk I/O",
    value: "--",
    icon: HardDrive,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    title: "Network",
    value: "--",
    icon: Activity,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
];

export default function MetricsPage() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Monitoring", href: "/dashboard/monitoring" },
    { label: "Metrics" },
  ];

  return (
    <AppLayout>
      <PageContainer
        title="Metrics"
        description="Cluster and application performance metrics"
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-4 text-sm text-muted-foreground">
            <Construction className="h-4 w-4" />
            <span>
              Metrics dashboard is coming soon. This page will display real-time
              cluster and application metrics.
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {placeholderMetrics.map(metric => {
              const Icon = metric.icon;
              return (
                <Card key={metric.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {metric.title}
                    </CardTitle>
                    <div className={`rounded-lg p-2 ${metric.bgColor}`}>
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground/40">
                      {metric.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>
                Historical resource usage across your clusters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Charts will appear here once metrics collection is configured.
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
