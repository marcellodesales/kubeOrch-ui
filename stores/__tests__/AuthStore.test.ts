import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useAuthStore } from "../AuthStore";

// Mock the dependent stores
vi.mock("../PanelStore", () => ({
  usePanelStore: {
    getState: () => ({
      clearPanelState: vi.fn(),
    }),
  },
}));

vi.mock("../SidebarStore", () => ({
  useSidebarStore: {
    getState: () => ({
      clearSidebarState: vi.fn(),
    }),
  },
}));

vi.mock("../ResourcesStore", () => ({
  useResourcesStore: {
    getState: () => ({
      clearResourcesState: vi.fn(),
    }),
  },
}));

describe("AuthStore", () => {
  const mockUser = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    role: "admin",
  };

  const mockToken = "mock-jwt-token";

  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      expiresAt: null,
    });

    // Clear any timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should start with null user and token", () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.expiresAt).toBeNull();
    });
  });

  describe("setAuthDetails", () => {
    it("should set user, token, and isAuthenticated", () => {
      useAuthStore.getState().setAuthDetails(mockToken, mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should set expiresAt to 24 hours from now", () => {
      const now = new Date("2024-01-15T10:00:00Z").getTime();
      vi.setSystemTime(now);

      useAuthStore.getState().setAuthDetails(mockToken, mockUser);

      const state = useAuthStore.getState();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;
      expect(state.expiresAt).toBe(expectedExpiry);
    });
  });

  describe("removeAuthDetails", () => {
    it("should clear all auth state", () => {
      // First set some auth details
      useAuthStore.getState().setAuthDetails(mockToken, mockUser);

      // Then remove them
      useAuthStore.getState().removeAuthDetails();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.expiresAt).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    it("should return true when expiresAt is null", () => {
      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });

    it("should return false when token is not expired", () => {
      const now = new Date("2024-01-15T10:00:00Z").getTime();
      vi.setSystemTime(now);

      useAuthStore.getState().setAuthDetails(mockToken, mockUser);

      // Token should be valid (not expired)
      expect(useAuthStore.getState().isTokenExpired()).toBe(false);
    });

    it("should return true when token is expired", () => {
      const now = new Date("2024-01-15T10:00:00Z").getTime();
      vi.setSystemTime(now);

      useAuthStore.getState().setAuthDetails(mockToken, mockUser);

      // Advance time by 25 hours (past the 24 hour expiry)
      vi.setSystemTime(now + 25 * 60 * 60 * 1000);

      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });

    it("should return false right before expiry", () => {
      const now = new Date("2024-01-15T10:00:00Z").getTime();
      vi.setSystemTime(now);

      useAuthStore.getState().setAuthDetails(mockToken, mockUser);

      // Advance time by 23 hours 59 minutes (just before expiry)
      vi.setSystemTime(now + 23 * 60 * 60 * 1000 + 59 * 60 * 1000);

      expect(useAuthStore.getState().isTokenExpired()).toBe(false);
    });
  });

  describe("validateAndGetToken", () => {
    it("should return null when token is null", () => {
      expect(useAuthStore.getState().validateAndGetToken()).toBeNull();
    });

    it("should return null when expiresAt is null", () => {
      useAuthStore.setState({ token: mockToken, expiresAt: null });
      expect(useAuthStore.getState().validateAndGetToken()).toBeNull();
    });

    it("should return token when valid and not expired", () => {
      const now = new Date("2024-01-15T10:00:00Z").getTime();
      vi.setSystemTime(now);

      useAuthStore.getState().setAuthDetails(mockToken, mockUser);

      expect(useAuthStore.getState().validateAndGetToken()).toBe(mockToken);
    });

    it("should return null and clear auth when token is expired", () => {
      const now = new Date("2024-01-15T10:00:00Z").getTime();
      vi.setSystemTime(now);

      useAuthStore.getState().setAuthDetails(mockToken, mockUser);

      // Advance time past expiry
      vi.setSystemTime(now + 25 * 60 * 60 * 1000);

      const result = useAuthStore.getState().validateAndGetToken();

      expect(result).toBeNull();
      // Auth should be cleared
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
    });
  });
});
