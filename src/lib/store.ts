import { create } from 'zustand';
import { getLogger } from '@/lib/logger';
import type { ProjectStore } from '@/types';


const logger = getLogger('ProjectStore');

// 型定義を拡張して setSelectedImageTags を含める
export interface ExtendedProjectStore extends ProjectStore {
  setSelectedImageTags: (tags: string[]) => void;
}

export const useProjectStore = create<ExtendedProjectStore>((set) => ({
  projects: [],
  selectedTags: [],
  selectedImageTags: [],
  isDrawerOpen: false,
  isGridVisible: false,
  
  setProjects: (projects) => set({ projects }),
  
  toggleTag: (tag) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    })),
  
  toggleImageTag: (tag) =>
    set((state) => {
      logger.debug('Toggling image tag', {
        currentTags: state.selectedImageTags,
        toggledTag: tag
      });
      
      return {
        selectedImageTags: state.selectedImageTags.includes(tag) ? [] : [tag],
      };
    }),
  
    setSelectedImageTags: (tags) => {
      // ここにデバッグログを追加
      logger.debug('Setting image tags in Store', { 
        newTags: tags,
        previousState: "See state snapshot below"
      });
      return set({ selectedImageTags: tags });
    },
  
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  toggleGridVisible: () => set((state) => ({ isGridVisible: !state.isGridVisible })),
  setGridVisible: (isVisible) => set({ isGridVisible: isVisible }),
})); 