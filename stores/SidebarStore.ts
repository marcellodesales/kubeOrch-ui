import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SidebarStore = {
  openMenus: { [key: string]: boolean };
  toggleMenu: (title: string) => void;
  setMenuOpen: (title: string, isOpen: boolean) => void;
  clearSidebarState: () => void;
};

export const useSidebarStore = create<SidebarStore>()(
  persist(
    set => ({
      openMenus: {},
      toggleMenu: title =>
        set(state => ({
          openMenus: {
            ...state.openMenus,
            [title]: !state.openMenus[title],
          },
        })),
      setMenuOpen: (title, isOpen) =>
        set(state => ({
          openMenus: {
            ...state.openMenus,
            [title]: isOpen,
          },
        })),
      clearSidebarState: () => set({ openMenus: {} }),
    }),
    {
      name: "sidebar-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
