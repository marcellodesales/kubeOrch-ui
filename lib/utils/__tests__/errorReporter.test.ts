import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { errorReporter } from "../errorReporter";

describe("errorReporter", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("report", () => {
    it("should log errors to console.error by default", () => {
      const error = new Error("test error");
      errorReporter.report(error);

      expect(console.error).toHaveBeenCalledWith(
        "[ErrorReporter]",
        error,
        ""
      );
    });

    it("should include source in log label", () => {
      const error = new Error("test error");
      errorReporter.report(error, { source: "TestComponent" });

      expect(console.error).toHaveBeenCalledWith(
        "[TestComponent]",
        error,
        ""
      );
    });

    it("should include metadata in log", () => {
      const error = new Error("test error");
      const metadata = { userId: "123", page: "/dashboard" };
      errorReporter.report(error, { metadata });

      expect(console.error).toHaveBeenCalledWith(
        "[ErrorReporter]",
        error,
        metadata
      );
    });

    it("should use console.warn for warning severity", () => {
      const error = new Error("warning");
      errorReporter.report(error, { severity: "warning" });

      expect(console.warn).toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it("should use console.warn for info severity", () => {
      const error = new Error("info");
      errorReporter.report(error, { severity: "info" });

      expect(console.warn).toHaveBeenCalled();
    });

    it("should use console.error for fatal severity", () => {
      const error = new Error("fatal");
      errorReporter.report(error, { severity: "fatal" });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("reportMessage", () => {
    it("should create an Error from string message", () => {
      errorReporter.reportMessage("something failed");

      expect(console.error).toHaveBeenCalledWith(
        "[ErrorReporter]",
        expect.any(Error),
        ""
      );
    });

    it("should pass context through", () => {
      errorReporter.reportMessage("failed", { source: "API" });

      expect(console.error).toHaveBeenCalledWith(
        "[API]",
        expect.any(Error),
        ""
      );
    });
  });

  describe("initGlobalHandlers", () => {
    it("should register window event listeners", () => {
      const addEventSpy = vi.spyOn(window, "addEventListener");

      errorReporter.initGlobalHandlers();

      expect(addEventSpy).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      );
      expect(addEventSpy).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function)
      );
    });
  });
});
