import { describe, it, expect } from "vitest";
import { getErrorMessage, isNetworkError, isAuthError } from "../errorHandling";

describe("errorHandling", () => {
  describe("getErrorMessage", () => {
    it("should return the string directly if error is a string", () => {
      expect(getErrorMessage("Something went wrong")).toBe(
        "Something went wrong"
      );
    });

    it("should return error from API response data.error", () => {
      const error = new Error("Request failed");
      (error as any).response = {
        data: { error: "Invalid credentials" },
        status: 400,
      };
      expect(getErrorMessage(error)).toBe("Invalid credentials");
    });

    it("should return message from API response data.message", () => {
      const error = new Error("Request failed");
      (error as any).response = {
        data: { message: "User not found" },
        status: 404,
      };
      expect(getErrorMessage(error)).toBe("User not found");
    });

    it("should prefer data.error over data.message", () => {
      const error = new Error("Request failed");
      (error as any).response = {
        data: { error: "Primary error", message: "Secondary message" },
        status: 400,
      };
      expect(getErrorMessage(error)).toBe("Primary error");
    });

    it("should fall back to error.message if no response data", () => {
      const error = new Error("Network error");
      expect(getErrorMessage(error)).toBe("Network error");
    });

    it("should return default message for unknown error types", () => {
      expect(getErrorMessage(null)).toBe("An error occurred");
      expect(getErrorMessage(undefined)).toBe("An error occurred");
      expect(getErrorMessage(123)).toBe("An error occurred");
      expect(getErrorMessage({})).toBe("An error occurred");
    });

    it("should use custom default message", () => {
      expect(getErrorMessage(null, "Custom error")).toBe("Custom error");
    });

    it("should handle error with empty response", () => {
      const error = new Error("Error");
      (error as any).response = {};
      expect(getErrorMessage(error)).toBe("Error");
    });

    it("should handle error with response but no data", () => {
      const error = new Error("Error");
      (error as any).response = { status: 500 };
      expect(getErrorMessage(error)).toBe("Error");
    });
  });

  describe("isNetworkError", () => {
    it("should return true for errors without response but with message", () => {
      const error = new Error("Network Error");
      expect(isNetworkError(error)).toBe(true);
    });

    it("should return false for errors with response", () => {
      const error = new Error("Request failed");
      (error as any).response = { status: 500, data: {} };
      expect(isNetworkError(error)).toBe(false);
    });

    it("should return false for non-Error types", () => {
      expect(isNetworkError("string error")).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
      expect(isNetworkError({})).toBe(false);
    });

    it("should return false for Error without message", () => {
      const error = new Error();
      error.message = "";
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe("isAuthError", () => {
    it("should return true for 401 status", () => {
      const error = new Error("Unauthorized");
      (error as any).response = { status: 401 };
      expect(isAuthError(error)).toBe(true);
    });

    it("should return true for 403 status", () => {
      const error = new Error("Forbidden");
      (error as any).response = { status: 403 };
      expect(isAuthError(error)).toBe(true);
    });

    it("should return false for other status codes", () => {
      const error = new Error("Not found");
      (error as any).response = { status: 404 };
      expect(isAuthError(error)).toBe(false);
    });

    it("should return false for 500 status", () => {
      const error = new Error("Server error");
      (error as any).response = { status: 500 };
      expect(isAuthError(error)).toBe(false);
    });

    it("should return false for errors without response", () => {
      const error = new Error("Network error");
      expect(isAuthError(error)).toBe(false);
    });

    it("should return false for non-Error types", () => {
      expect(isAuthError("string error")).toBe(false);
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
      expect(isAuthError({ response: { status: 401 } })).toBe(false);
    });
  });
});
