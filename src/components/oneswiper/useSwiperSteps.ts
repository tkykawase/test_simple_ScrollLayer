import { useState, useRef } from 'react';

type InitStep = 'step1' | 'step2' | 'step3' | 'step4' | 'completed';

interface SwiperStepsState {
  currentStep: InitStep;
  imageSet: string[];
  setHeight: number;
  showBoundaries: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SwiperStepsActions {
  initializeStep1: (images: string[]) => Promise<void>;
  completeStep2: () => void;
  measureStep3: () => Promise<void>;
  enableStep4: () => void;
  reset: () => void;
}

export const useSwiperSteps = (): [SwiperStepsState, SwiperStepsActions] => {
  const [state, setState] = useState<SwiperStepsState>({
    currentStep: 'step1',
    imageSet: [],
    setHeight: 0,
    showBoundaries: false,
    isLoading: true,
    error: null
  });
  
  const initRef = useRef(false);

  // Step 1: 画像セットの作成と読み込み
  const initializeStep1 = async (images: string[]): Promise<void> => {
    if (initRef.current) return;
    initRef.current = true;

    console.group('🔄 Step 1: 画像セットの作成と読み込み');
    console.log('📸 元の画像数:', images.length);
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 画像セットを設定
      setState(prev => ({ ...prev, imageSet: images }));
      console.log('📦 画像セット作成完了');
      
      // 画像のプリロード
      console.log('🔄 画像プリロード開始');
      await Promise.all(
        images.map((src, index) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              console.log(`✅ 画像${index + 1}: ${src.split('/').pop()}`, {
                size: `${img.naturalWidth}x${img.naturalHeight}`
              });
              resolve(img);
            };
            img.onerror = () => reject(new Error(`画像読み込みエラー: ${src}`));
            img.src = src;
          });
        })
      );
      
      console.log('✅ Step 1 完了: 全画像プリロード済み');
      setState(prev => ({ 
        ...prev, 
        currentStep: 'step2',
        isLoading: false
      }));
      console.groupEnd();
      
    } catch (error) {
      console.error('❌ Step 1 エラー:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
      console.groupEnd();
    }
  };

  // Step 2: セットの複製と配置
  const completeStep2 = (): void => {
    console.group('🔄 Step 2: セットの複製と配置');
    console.log('📊 画像セット:', state.imageSet.length);
    console.log('📸 複製セット数: 5');
    
    // セットの複製準備完了
    console.log('✅ Step 2 完了: セット複製準備完了');
    setState(prev => ({ ...prev, currentStep: 'step3' }));
    console.groupEnd();
  };

  // Step 3: 中央セットの調整（高さ測定）
  const measureStep3 = async (): Promise<void> => {
    console.group('🔄 Step 3: 中央セットの調整');
    
    return new Promise((resolve) => {
      // DOM更新を待つ
      setTimeout(() => {
        const measurementSet = document.querySelector('.measurement-set');
        if (measurementSet) {
          const height = measurementSet.clientHeight;
          
          // 個別画像の高さ確認
          const imageElements = measurementSet.querySelectorAll('img');
          console.log('📏 個別画像高さ:');
          imageElements.forEach((img, i) => {
            console.log(`  画像${i + 1}: ${img.clientHeight}px`);
          });
          
          console.log('📏 1セット高さ:', height);
          console.log('📏 全体高さ:', height * 5);
          
          setState(prev => ({ ...prev, setHeight: height, currentStep: 'step4' }));
          console.log('✅ Step 3 完了: 高さ測定完了');
        } else {
          console.error('❌ .measurement-set が見つかりません');
          setState(prev => ({ ...prev, error: 'measurement-set not found' }));
        }
        console.groupEnd();
        resolve();
      }, 100);
    });
  };

  // Step 4: 境界線の作成
  const enableStep4 = (): void => {
    console.group('🔄 Step 4: 境界線の作成');
    console.log('📊 現在の高さ:', state.setHeight);
    console.log('🔄 境界線の種類:');
    console.log('  - 上端境界: 最初のセットの前');
    console.log('  - セット間境界: 各セット間に自動配置');
    console.log('  - 下端境界: 最後のセットの後');
    
    setState(prev => ({ 
      ...prev, 
      showBoundaries: true,
      currentStep: 'completed'
    }));
    
    console.log('✅ Step 4 完了: 境界線有効化（上端・セット間・下端）');
    console.log('🎉 全ステップ完了');
    console.groupEnd();
  };

  // リセット
  const reset = (): void => {
    initRef.current = false;
    setState({
      currentStep: 'step1',
      imageSet: [],
      setHeight: 0,
      showBoundaries: false,
      isLoading: true,
      error: null
    });
  };

  return [
    state,
    {
      initializeStep1,
      completeStep2,
      measureStep3,
      enableStep4,
      reset
    }
  ];
};