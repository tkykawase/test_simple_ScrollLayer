// スワイパー関連の型定義
export type InitStep = 'step1' | 'step2' | 'step3' | 'step4' | 'completed';

export interface SetData {
  id: string;
  setNumber: number;
  images: string[];
  side: 'left' | 'right';
}

export interface SwiperStepsState {
  currentStep: InitStep;
  imageSet: string[];
  setHeight: number;
  showBoundaries: boolean;
  isLoading: boolean;
  error: string | null;
  currentSets: SetData[];
  setCounter: number;
}

export interface SwiperStepsActions {
  initializeStep1: (images: string[]) => Promise<void>;
  completeStep2: () => void;
  measureStep3: () => Promise<void>;
  enableStep4: () => void;
  reset: () => void;
  addSetToTop: () => void;
  addSetToBottom: () => void;
  addSetToTopAndRemoveFromBottom: () => void;
  addSetToBottomAndRemoveFromTop: () => void;
  removeSetFromTop: () => void;
  removeSetFromBottom: () => void;
} 