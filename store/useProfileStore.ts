import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { emptyDraft } from '@/lib/profile';
import type { ApplicationStatus, EducationEntry, ProfileDraft } from '@/types/domain';

type Interaction = { isHidden: boolean; isSaved: boolean; applicationStatus: ApplicationStatus };

type ProfileState = {
  hydrated: boolean;
  draft: ProfileDraft;
  interactions: Record<string, Interaction>;
  studied: Record<string, boolean>;
  setHydrated: (value: boolean) => void;
  patch: (partial: Partial<ProfileDraft>) => void;
  setEducation: (index: number, entry: EducationEntry) => void;
  addEducation: () => void;
  removeEducation: (index: number) => void;
  toggleList: (key: 'driverLicenses' | 'certificates', value: string) => void;
  setInteraction: (positionId: string, partial: Partial<Interaction>) => void;
  toggleStudied: (topicId: string) => void;
  replaceDraft: (draft: ProfileDraft) => void;
  reset: () => void;
};

const emptyInteraction = (): Interaction => ({ isHidden: false, isSaved: false, applicationStatus: 'none' });

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      hydrated: false,
      draft: emptyDraft(),
      interactions: {},
      studied: {},
      setHydrated: (hydrated) => set({ hydrated }),
      patch: (partial) => set((state) => ({ draft: { ...state.draft, ...partial } })),
      setEducation: (index, entry) =>
        set((state) => ({
          draft: {
            ...state.draft,
            educations: state.draft.educations.map((item, itemIndex) => (itemIndex === index ? entry : item)),
          },
        })),
      addEducation: () =>
        set((state) => ({
          draft: { ...state.draft, educations: [...state.draft.educations, { level: 'Lisans', department: '' }] },
        })),
      removeEducation: (index) =>
        set((state) => ({
          draft: {
            ...state.draft,
            educations: state.draft.educations.filter((_, itemIndex) => itemIndex !== index),
          },
        })),
      toggleList: (key, value) =>
        set((state) => {
          const current = state.draft[key];
          const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
          return { draft: { ...state.draft, [key]: next } };
        }),
      setInteraction: (positionId, partial) =>
        set((state) => ({
          interactions: {
            ...state.interactions,
            [positionId]: { ...emptyInteraction(), ...state.interactions[positionId], ...partial },
          },
        })),
      toggleStudied: (topicId) => set((state) => ({ studied: { ...state.studied, [topicId]: !state.studied[topicId] } })),
      replaceDraft: (draft) => set({ draft }),
      reset: () => set({ draft: emptyDraft(), interactions: {}, studied: {} }),
    }),
    {
      name: 'kpss-profile',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        try {
          if (!state?.draft) return;
          const educations = Array.isArray(state.draft.educations) ? state.draft.educations : [];
          const normalized = educations.map((item) =>
            (item.level as string) === 'Lise' ? { ...item, level: 'Ortaöğretim' as const } : item,
          );
          if (!Array.isArray(state.draft.educations) || normalized.some((item, index) => item.level !== educations[index]?.level)) {
            state.patch({ educations: normalized.length ? normalized : [{ level: 'Lisans', department: '' }] });
          }
          if (!Array.isArray(state.draft.kpssScores)) state.patch({ kpssScores: [] });
        } finally {
          state?.setHydrated(true);
        }
      },
      partialize: (state) => ({ draft: state.draft, interactions: state.interactions, studied: state.studied }),
    },
  ),
);
