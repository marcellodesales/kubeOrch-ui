import { Badge } from "@/components/ui/badge";
import type { AlertEventStatus } from "@/lib/services/alerts";

const config: Record<AlertEventStatus, { label: string; className: string }> = {
  firing: {
    label: "Firing",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  acknowledged: {
    label: "Acknowledged",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
};

export function AlertStatusBadge({ status }: { status: AlertEventStatus }) {
  const { label, className } = config[status] || config.firing;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
