import { create } from "zustand";
import type { Design } from "../types";
interface EditorState {
  design: Design;
  past: Design[];
  future: Design[];
  reset: (d: Design) => void;
  set: (d: Design) => void;
  undo: () => void;
  redo: () => void;
}
export const useEditorStore = create<EditorState>((set) => ({
  design: { background: "#eee", elements: [] },
  past: [],
  future: [],
  reset: (d) => set({ design: structuredClone(d), past: [], future: [] }),
  set: (d) =>
    set((s) => ({
      design: d,
      past: [...s.past.slice(-49), s.design],
      future: [],
    })),
  undo: () =>
    set((s) =>
      s.past.length
        ? {
            design: s.past[s.past.length - 1],
            past: s.past.slice(0, -1),
            future: [s.design, ...s.future],
          }
        : s,
    ),
  redo: () =>
    set((s) =>
      s.future.length
        ? {
            design: s.future[0],
            past: [...s.past, s.design],
            future: s.future.slice(1),
          }
        : s,
    ),
}));
