"use client";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  title,
  description,
  actions,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {(title || description || actions) && (
        <div className="border-b border-border bg-background px-6 py-6">
          <div
            className={cn(
              "mx-auto flex items-center justify-between",
              !fullWidth && "max-w-7xl"
            )}
          >
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-background">
        <div
          className={cn(
            "min-h-full p-6 pb-12",
            !fullWidth && "mx-auto max-w-7xl"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
