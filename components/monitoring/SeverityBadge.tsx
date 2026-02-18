import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { AlertSeverity } from "@/lib/services/alerts";

const config: Record<
  AlertSeverity,
  { label: string; className: string; icon: typeof AlertCircle }
> = {
  critical: {
    label: "Critical",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: AlertCircle,
  },
  warning: {
    label: "Warning",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: AlertTriangle,
  },
  info: {
    label: "Info",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: Info,
  },
};

export function SeverityBadge({
  severity,
  showIcon = true,
}: {
  severity: AlertSeverity;
  showIcon?: boolean;
}) {
  const { label, className, icon: Icon } = config[severity] || config.info;
  return (
    <Badge variant="outline" className={className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}
