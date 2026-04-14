import * as React from "react";

import { cn } from "@/lib/utils";

function CompactCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-2 rounded-lg border py-2 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function CompactCardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <header
      data-slot="compact-card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  );
}

function CompactCardTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    // eslint-disable-next-line jsx-a11y/heading-has-content -- children are always passed by consumers
    <h3
      data-slot="compact-card-title"
      className={cn("text-sm leading-none font-semibold", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

function CompactCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="compact-card-description"
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

function CompactCardAction({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CompactCardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-content"
      className={cn("px-3 text-sm", className)}
      {...props}
    />
  );
}

function CompactCardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-footer"
      className={cn("flex items-center px-3", className)}
      {...props}
    />
  );
}

export {
  CompactCard,
  CompactCardHeader,
  CompactCardFooter,
  CompactCardTitle,
  CompactCardAction,
  CompactCardDescription,
  CompactCardContent,
};
