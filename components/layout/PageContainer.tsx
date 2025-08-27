"use client";

import React from "react";
import { BreadcrumbNav } from "./BreadcrumbNav";
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
  breadcrumbs,
  actions,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-b border-border bg-muted/30 px-6 py-2">
          <BreadcrumbNav items={breadcrumbs} />
        </div>
      )}

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

      <div className="flex-1 overflow-auto bg-background">
        <div className={cn("h-full p-6", !fullWidth && "mx-auto max-w-7xl")}>
          {children}
        </div>
      </div>
    </div>
  );
}
