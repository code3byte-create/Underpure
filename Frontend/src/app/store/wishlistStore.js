import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      ids: [],

      add: (id) =>
        set((state) => ({
          ids: state.ids.includes(id) ? state.ids : [...state.ids, id],
        })),

      remove: (id) =>
        set((state) => ({ ids: state.ids.filter((i) => i !== id) })),

      toggle: (id) => {
        if (get().ids.includes(id)) {
          get().remove(id);
        } else {
          get().add(id);
        }
      },

      has: (id) => get().ids.includes(id),

      setIds: (ids) => set({ ids }),

      clear: () => set({ ids: [] }),
    }),
    {
      name: "velour-wishlist",
    },
  ),
);
