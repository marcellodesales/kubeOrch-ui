"use client";

import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { MetricsOverview } from "@/components/monitoring/MetricsOverview";
import { ResourceMetricsTable } from "@/components/monitoring/ResourceMetricsTable";
import { useClusterStore } from "@/stores/ClusterStore";

export default function MetricsPage() {
  const { fetchClusters } = useClusterStore();

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Monitoring", href: "/dashboard/monitoring" },
    { label: "Metrics" },
  ];

  return (
    <AppLayout>
      <PageContainer
        title="Metrics"
        description="Live cluster and resource performance metrics"
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          <MetricsOverview />
          <ResourceMetricsTable />
        </div>
      </PageContainer>
    </AppLayout>
  );
}
