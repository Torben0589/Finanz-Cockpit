import { create } from "zustand";
import { currentMonthKey } from "@/lib/utils";

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  selectedMonth: currentMonthKey(),
  setSelectedMonth: (month) => set({ selectedMonth: month })
}));
