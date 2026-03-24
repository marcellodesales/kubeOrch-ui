/**
 * Error reporting abstraction layer.
 *
 * Logs errors to the console by default. Replace the `report` function
 * with a call to Sentry, Datadog, or any other error tracking service
 * when ready for production monitoring.
 */

interface ErrorContext {
  /** Where the error occurred (e.g., component name, API call) */
  source?: string;
  /** Additional metadata to attach to the error report */
  metadata?: Record<string, unknown>;
  /** Error severity level */
  severity?: "fatal" | "error" | "warning" | "info";
}

function report(error: unknown, context: ErrorContext = {}): void {
  const { source, metadata, severity = "error" } = context;

  // Default implementation: console logging.
  // Replace this with your error tracking service:
  //   Sentry.captureException(error, { tags: { source }, extra: metadata });
  const label = source ? `[${source}]` : "[ErrorReporter]";

  if (severity === "fatal" || severity === "error") {
    console.error(label, error, metadata ?? "");
  } else {
    console.warn(label, error, metadata ?? "");
  }
}

function reportMessage(message: string, context: ErrorContext = {}): void {
  report(new Error(message), context);
}

/**
 * Initialize global error handlers for uncaught errors.
 * Call this once in the app root (e.g., layout.tsx).
 */
function initGlobalHandlers(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    report(event.error ?? event.message, {
      source: "window.onerror",
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    report(event.reason, {
      source: "unhandledrejection",
      severity: "error",
    });
  });
}

export const errorReporter = {
  report,
  reportMessage,
  initGlobalHandlers,
};
