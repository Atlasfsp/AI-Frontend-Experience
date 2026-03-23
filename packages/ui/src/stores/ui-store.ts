import { create } from 'zustand';

import type { BacTheme } from '../components/theme-toggle';

export interface UiState {
  /** Whether the sidebar navigation is collapsed. */
  sidebarCollapsed: boolean;
  /** Whether the command palette overlay is open. */
  commandPaletteOpen: boolean;
  /** The active visual theme. */
  activeTheme: BacTheme;
  /** The currently selected workspace identifier. */
  activeWorkspaceId: string | null;
}

export interface UiActions {
  toggleSidebar: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setTheme: (theme: BacTheme) => void;
  setWorkspace: (workspaceId: string) => void;
}

export type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>((set) => ({
  // State
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activeTheme: 'enterprise',
  activeWorkspaceId: null,

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  openCommandPalette: () =>
    set({ commandPaletteOpen: true }),

  closeCommandPalette: () =>
    set({ commandPaletteOpen: false }),

  setTheme: (theme) =>
    set({ activeTheme: theme }),

  setWorkspace: (workspaceId) =>
    set({ activeWorkspaceId: workspaceId }),
}));
