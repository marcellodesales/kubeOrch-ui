import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWorkflowStore } from "../WorkflowStore";

describe("WorkflowStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    useWorkflowStore.setState({
      nodeUpdateHandler: null,
      settingsOpenHandler: null,
      editable: true,
      secretValues: {},
      envValues: {},
    });
  });

  describe("initial state", () => {
    it("should have correct initial values", () => {
      const state = useWorkflowStore.getState();
      expect(state.nodeUpdateHandler).toBeNull();
      expect(state.settingsOpenHandler).toBeNull();
      expect(state.editable).toBe(true);
      expect(state.secretValues).toEqual({});
      expect(state.envValues).toEqual({});
    });
  });

  describe("setEditable", () => {
    it("should set editable to false", () => {
      useWorkflowStore.getState().setEditable(false);
      expect(useWorkflowStore.getState().editable).toBe(false);
    });

    it("should set editable to true", () => {
      useWorkflowStore.getState().setEditable(false);
      useWorkflowStore.getState().setEditable(true);
      expect(useWorkflowStore.getState().editable).toBe(true);
    });
  });

  describe("setNodeUpdateHandler", () => {
    it("should set the handler", () => {
      const handler = vi.fn();
      useWorkflowStore.getState().setNodeUpdateHandler(handler);
      expect(useWorkflowStore.getState().nodeUpdateHandler).toBe(handler);
    });

    it("should set handler to null", () => {
      const handler = vi.fn();
      useWorkflowStore.getState().setNodeUpdateHandler(handler);
      useWorkflowStore.getState().setNodeUpdateHandler(null);
      expect(useWorkflowStore.getState().nodeUpdateHandler).toBeNull();
    });
  });

  describe("updateNodeData", () => {
    it("should call the handler with nodeId and data", () => {
      const handler = vi.fn();
      useWorkflowStore.getState().setNodeUpdateHandler(handler);

      const nodeId = "node-123";
      const data = { id: "node-123", name: "test-node" } as any;

      useWorkflowStore.getState().updateNodeData(nodeId, data);

      expect(handler).toHaveBeenCalledWith(nodeId, data);
    });

    it("should not throw if handler is null", () => {
      const nodeId = "node-123";
      const data = { id: "node-123", name: "test-node" } as any;

      expect(() => {
        useWorkflowStore.getState().updateNodeData(nodeId, data);
      }).not.toThrow();
    });
  });

  describe("secret values", () => {
    describe("setSecretValue", () => {
      it("should set a secret value for a node", () => {
        useWorkflowStore.getState().setSecretValue("node-1", "API_KEY", "secret123");

        const values = useWorkflowStore.getState().getSecretValues();
        expect(values["node-1"]).toEqual({ API_KEY: "secret123" });
      });

      it("should add multiple secrets to the same node", () => {
        useWorkflowStore.getState().setSecretValue("node-1", "API_KEY", "secret123");
        useWorkflowStore.getState().setSecretValue("node-1", "DB_PASS", "password");

        const values = useWorkflowStore.getState().getSecretValues();
        expect(values["node-1"]).toEqual({
          API_KEY: "secret123",
          DB_PASS: "password",
        });
      });

      it("should handle multiple nodes", () => {
        useWorkflowStore.getState().setSecretValue("node-1", "KEY_1", "value1");
        useWorkflowStore.getState().setSecretValue("node-2", "KEY_2", "value2");

        const values = useWorkflowStore.getState().getSecretValues();
        expect(values["node-1"]).toEqual({ KEY_1: "value1" });
        expect(values["node-2"]).toEqual({ KEY_2: "value2" });
      });

      it("should overwrite existing secret value", () => {
        useWorkflowStore.getState().setSecretValue("node-1", "API_KEY", "old");
        useWorkflowStore.getState().setSecretValue("node-1", "API_KEY", "new");

        const values = useWorkflowStore.getState().getSecretValues();
        expect(values["node-1"]["API_KEY"]).toBe("new");
      });
    });

    describe("removeSecretKey", () => {
      it("should remove a secret key from a node", () => {
        useWorkflowStore.getState().setSecretValue("node-1", "API_KEY", "secret123");
        useWorkflowStore.getState().setSecretValue("node-1", "DB_PASS", "password");

        useWorkflowStore.getState().removeSecretKey("node-1", "API_KEY");

        const values = useWorkflowStore.getState().getSecretValues();
        expect(values["node-1"]).toEqual({ DB_PASS: "password" });
        expect(values["node-1"]["API_KEY"]).toBeUndefined();
      });

      it("should not throw when removing non-existent key", () => {
        expect(() => {
          useWorkflowStore.getState().removeSecretKey("node-1", "NONEXISTENT");
        }).not.toThrow();
      });
    });

    describe("renameSecretKey", () => {
      it("should rename a secret key preserving the value", () => {
        useWorkflowStore.getState().setSecretValue("node-1", "OLD_KEY", "myvalue");

        useWorkflowStore.getState().renameSecretKey("node-1", "OLD_KEY", "NEW_KEY");

        const values = useWorkflowStore.getState().getSecretValues();
        expect(values["node-1"]["NEW_KEY"]).toBe("myvalue");
        expect(values["node-1"]["OLD_KEY"]).toBeUndefined();
      });

      it("should handle renaming non-existent key (creates empty string)", () => {
        useWorkflowStore.getState().renameSecretKey("node-1", "NONEXISTENT", "NEW_KEY");

        const values = useWorkflowStore.getState().getSecretValues();
        expect(values["node-1"]["NEW_KEY"]).toBe("");
      });
    });

    describe("clearSecretValues", () => {
      it("should clear all secret values", () => {
        useWorkflowStore.getState().setSecretValue("node-1", "KEY_1", "value1");
        useWorkflowStore.getState().setSecretValue("node-2", "KEY_2", "value2");

        useWorkflowStore.getState().clearSecretValues();

        const values = useWorkflowStore.getState().getSecretValues();
        expect(values).toEqual({});
      });
    });
  });

  describe("env values", () => {
    describe("setEnvValue", () => {
      it("should set an env value for a node", () => {
        useWorkflowStore.getState().setEnvValue("node-1", "PORT", "3000");

        const values = useWorkflowStore.getState().getEnvValues();
        expect(values["node-1"]).toEqual({ PORT: "3000" });
      });

      it("should add multiple env vars to the same node", () => {
        useWorkflowStore.getState().setEnvValue("node-1", "PORT", "3000");
        useWorkflowStore.getState().setEnvValue("node-1", "HOST", "localhost");

        const values = useWorkflowStore.getState().getEnvValues();
        expect(values["node-1"]).toEqual({
          PORT: "3000",
          HOST: "localhost",
        });
      });

      it("should handle multiple nodes", () => {
        useWorkflowStore.getState().setEnvValue("node-1", "ENV_1", "value1");
        useWorkflowStore.getState().setEnvValue("node-2", "ENV_2", "value2");

        const values = useWorkflowStore.getState().getEnvValues();
        expect(values["node-1"]).toEqual({ ENV_1: "value1" });
        expect(values["node-2"]).toEqual({ ENV_2: "value2" });
      });

      it("should overwrite existing env value", () => {
        useWorkflowStore.getState().setEnvValue("node-1", "PORT", "3000");
        useWorkflowStore.getState().setEnvValue("node-1", "PORT", "8080");

        const values = useWorkflowStore.getState().getEnvValues();
        expect(values["node-1"]["PORT"]).toBe("8080");
      });
    });

    describe("removeEnvKey", () => {
      it("should remove an env key from a node", () => {
        useWorkflowStore.getState().setEnvValue("node-1", "PORT", "3000");
        useWorkflowStore.getState().setEnvValue("node-1", "HOST", "localhost");

        useWorkflowStore.getState().removeEnvKey("node-1", "PORT");

        const values = useWorkflowStore.getState().getEnvValues();
        expect(values["node-1"]).toEqual({ HOST: "localhost" });
        expect(values["node-1"]["PORT"]).toBeUndefined();
      });

      it("should not throw when removing non-existent key", () => {
        expect(() => {
          useWorkflowStore.getState().removeEnvKey("node-1", "NONEXISTENT");
        }).not.toThrow();
      });
    });

    describe("clearEnvValues", () => {
      it("should clear all env values", () => {
        useWorkflowStore.getState().setEnvValue("node-1", "ENV_1", "value1");
        useWorkflowStore.getState().setEnvValue("node-2", "ENV_2", "value2");

        useWorkflowStore.getState().clearEnvValues();

        const values = useWorkflowStore.getState().getEnvValues();
        expect(values).toEqual({});
      });
    });
  });

  describe("openNodeSettings", () => {
    it("should call the settings handler with nodeId and data", () => {
      const handler = vi.fn();
      useWorkflowStore.getState().setSettingsOpenHandler(handler);

      const nodeId = "node-123";
      const data = { id: "node-123", name: "test-node" } as any;

      useWorkflowStore.getState().openNodeSettings(nodeId, data);

      expect(handler).toHaveBeenCalledWith(nodeId, data);
    });

    it("should not throw if handler is null", () => {
      const nodeId = "node-123";
      const data = { id: "node-123", name: "test-node" } as any;

      expect(() => {
        useWorkflowStore.getState().openNodeSettings(nodeId, data);
      }).not.toThrow();
    });
  });
});
