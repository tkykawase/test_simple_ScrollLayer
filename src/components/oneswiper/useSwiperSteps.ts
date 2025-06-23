import { useState, useRef } from 'react';
import type { SetData, SwiperStepsState, SwiperStepsActions } from './swiper-types';

// =============================
// useSwiperSteps.ts
// このフックは「初期セット生成専用フック」です。
// 初期化・画像セット生成・プリロード・初期セット配置・高さ測定など、
// スワイパーの初期状態を作ることに特化しています。
// =============================

export const useSwiperSteps = (side: 'left' | 'right'): [SwiperStepsState, SwiperStepsActions] => {
  const [state, setState] = useState<SwiperStepsState>({
    currentStep: 'step1',
    imageSet: [],
    setHeight: 0,
    showBoundaries: false,
    isLoading: true,
    error: null,
    currentSets: [],
    setCounter: 0
  });
  
  const initRef = useRef(false);

  // セット生成関数
  const generateSet = (setNumber: number, imageSet: string[]): SetData => ({
    id: `set-${side}-${setNumber}`,
    setNumber,
    images: imageSet,
    side
  });

  // 初期セット生成
  const generateInitialSets = (): SetData[] => {
    const sets: SetData[] = [];
    for (let i = 1; i <= 5; i++) {
      sets.push(generateSet(i, state.imageSet));
    }
    return sets;
  };

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
    
    // 初期セットを生成
    const initialSets = generateInitialSets();
    setState(prev => ({ 
      ...prev, 
      currentSets: initialSets,
      setCounter: 5,
      currentStep: 'step3'
    }));
    
    console.log('✅ Step 2 完了: セット複製準備完了');
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
          
          console.log('�� 1セット高さ:', height);
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

  // 無限スクロール用のセット操作
  const addSetToTop = (): void => {
    setState(prev => {
      const newSetNumber = prev.setCounter + 1;
      const newSet = generateSet(newSetNumber, state.imageSet);
      
      console.log(`🔄 セット追加（上）: Set${newSetNumber}`);
      
      return {
        ...prev,
        currentSets: [newSet, ...prev.currentSets.slice(0, -1)], // 上に追加、下から削除
        setCounter: newSetNumber
      };
    });
  };

  const addSetToBottom = (): void => {
    setState(prev => {
      const newSetNumber = prev.setCounter + 1;
      const newSet = generateSet(newSetNumber, state.imageSet);
      
      console.log(`🔄 セット追加（下）: Set${newSetNumber}`);
      
      return {
        ...prev,
        currentSets: [...prev.currentSets.slice(1), newSet], // 下に追加、上から削除
        setCounter: newSetNumber
      };
    });
  };

  // セットの追加と削除を同時に実行する関数
  const addSetToTopAndRemoveFromBottom = (): void => {
    setState(prev => {
      const newSetNumber = prev.setCounter + 1;
      const newSet = generateSet(newSetNumber, state.imageSet);
      
      console.log(`🔄 セット操作（上追加・下削除）: Set${newSetNumber}`);
      
      return {
        ...prev,
        currentSets: [newSet, ...prev.currentSets.slice(0, -1)], // 上に追加、下から削除
        setCounter: newSetNumber
      };
    });
  };

  const addSetToBottomAndRemoveFromTop = (): void => {
    console.log(`🔍 addSetToBottomAndRemoveFromTop 開始: 現在のカウンター = ${state.setCounter}`);
    
    setState(prev => {
      const newSetNumber = prev.setCounter + 1;
      const newSet = generateSet(newSetNumber, state.imageSet);
      
      console.log(`🔄 セット操作（下追加・上削除）: Set${newSetNumber} (前のカウンター: ${prev.setCounter})`);
      
      return {
        ...prev,
        currentSets: [...prev.currentSets.slice(1), newSet], // 下に追加、上から削除
        setCounter: newSetNumber
      };
    });
    
    console.log(`✅ addSetToBottomAndRemoveFromTop 完了`);
  };

  const removeSetFromTop = (): void => {
    console.log('🔄 セット削除（上）');
    // 実際の削除は addSetToBottom で同時に行われる
  };

  const removeSetFromBottom = (): void => {
    console.log('🔄 セット削除（下）');
    // 実際の削除は addSetToTop で同時に行われる
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
      error: null,
      currentSets: [],
      setCounter: 0
    });
  };

  return [
    state,
    {
      initializeStep1,
      completeStep2,
      measureStep3,
      enableStep4,
      reset,
      addSetToTop,
      addSetToBottom,
      addSetToTopAndRemoveFromBottom,
      addSetToBottomAndRemoveFromTop,
      removeSetFromTop,
      removeSetFromBottom
    }
  ];
};