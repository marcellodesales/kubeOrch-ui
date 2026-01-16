import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const DEFAULT_NODE_SETTINGS_WIDTH = 320; // Current default (w-80)

type PanelStore = {
  nodeSettingsWidth: number;
  setNodeSettingsWidth: (width: number) => void;
  clearPanelState: () => void;
};

export const usePanelStore = create<PanelStore>()(
  persist(
    set => ({
      nodeSettingsWidth: DEFAULT_NODE_SETTINGS_WIDTH,
      setNodeSettingsWidth: (width: number) =>
        set({ nodeSettingsWidth: width }),
      clearPanelState: () =>
        set({ nodeSettingsWidth: DEFAULT_NODE_SETTINGS_WIDTH }),
    }),
    {
      name: "panel-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
