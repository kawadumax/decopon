import { type Locale } from "@/scripts/types";
import { create } from "zustand";

interface LangStore {
  language: Locale;
  setLanguage: (lang: Locale) => void;
}

export const useLangStore = create<LangStore>((set) => ({
  language: "en" as Locale,
  setLanguage: (lang) => set({ language: lang }),
}));

