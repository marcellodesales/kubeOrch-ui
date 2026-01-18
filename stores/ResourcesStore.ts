import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ResourcesStore = {
  hideSystemResources: boolean;
  setHideSystemResources: (hide: boolean) => void;
  clearResourcesState: () => void;
};

export const useResourcesStore = create<ResourcesStore>()(
  persist(
    set => ({
      hideSystemResources: true, // Default to hiding system resources
      setHideSystemResources: (hide: boolean) =>
        set({ hideSystemResources: hide }),
      clearResourcesState: () => set({ hideSystemResources: true }),
    }),
    {
      name: "resources-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
