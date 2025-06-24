import { useEffect, useRef, useState } from 'react';
import { useSwiperSteps } from './useSwiperSteps';
import { useInertiaController } from './useInertiaController';

export const useSwiperController = (images: string[], side: 'left' | 'right') => {
  const [state, actions] = useSwiperSteps(side);
  const [debugScrollTop, setDebugScrollTop] = useState(0);
  const onScrollForDebug = process.env.NODE_ENV === 'development' ? setDebugScrollTop : undefined;
  const { contentRef, addForce, scrollToCenter } = useInertiaController(
    state.currentStep === 'completed' && state.setHeight > 0,
    onScrollForDebug
  );
  const [lastTotalDelta, setLastTotalDelta] = useState(0);
  const isCenteredRef = useRef(false);
  const canObserverLogRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const isProcessingRef = useRef(false);
  const lastProcessTimeRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isUpdatingSetsRef = useRef(false);
  const pendingBoundaryCrossRef = useRef<{ boundaryId: string; direction: 'up' | 'down' } | null>(null);
  const scrollAdjustmentRef = useRef<{ direction: 'up' | 'down' } | null>(null);
  
  // 🔥 追加: 境界要素の無限ロード防止機能
  const lastBoundaryTriggerRef = useRef<{ [key: string]: number }>({});
  const BOUNDARY_COOLDOWN = 500; // 500ms のクールダウン時間
  const consecutiveTriggerCountRef = useRef<{ [key: string]: number }>({});
  const MAX_CONSECUTIVE_TRIGGERS = 3; // 連続トリガーの最大回数

  const logDebug = (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, data);
    }
  };

  const getScrollDirection = (): 'up' | 'down' | null => {
    if (!contentRef.current) return null;
    const currentScrollTop = contentRef.current.scrollTop;
    const direction = currentScrollTop > lastScrollTopRef.current ? 'down' : 'up';
    lastScrollTopRef.current = currentScrollTop;
    return direction;
  };

  const handleImageClick = (setIndex: number, imageIndex: number, src: string) => {
    const imageName = src.split('/').pop() || 'unknown';
    logDebug('🎯 画像クリック/タッチ', {
      set: setIndex,
      image: imageIndex + 1,
      imageName: imageName,
      fullSrc: src,
      currentStep: state.currentStep,
      setHeight: state.setHeight
    });
    alert(`クリックされた画像: ${imageName}\nセット: ${setIndex}, 画像: ${imageIndex + 1}`);
  };

  const handleDebugClick = (setIndex: number, imageIndex: number, src: string) => {
    logDebug('🔍 デバッグ: クリックイベント発火', {
      set: setIndex,
      image: imageIndex + 1,
      src: src.split('/').pop()
    });
    handleImageClick(setIndex, imageIndex, src);
  };

  // 🔥 改善: 境界要素の無限ロード防止機能付きハンドラー
  const handleBoundaryCross = (boundaryId: string, direction: 'up' | 'down') => {
    const now = Date.now();
    const lastTrigger = lastBoundaryTriggerRef.current[boundaryId] || 0;
    const timeSinceLastTrigger = now - lastTrigger;

    // クールダウン期間中は処理をスキップ
    if (timeSinceLastTrigger < BOUNDARY_COOLDOWN) {
      logDebug(`⏳ 境界要素クールダウン中: [${boundaryId}] (残り${BOUNDARY_COOLDOWN - timeSinceLastTrigger}ms)`);
      return;
    }

    // 連続トリガー回数をチェック
    const consecutiveCount = consecutiveTriggerCountRef.current[boundaryId] || 0;
    if (consecutiveCount >= MAX_CONSECUTIVE_TRIGGERS) {
      logDebug(`🚫 境界要素の連続トリガー制限: [${boundaryId}] (${consecutiveCount}回)`);
      // 制限をリセットするために長めのクールダウンを設定
      lastBoundaryTriggerRef.current[boundaryId] = now + BOUNDARY_COOLDOWN * 3;
      consecutiveTriggerCountRef.current[boundaryId] = 0;
      return;
    }

    if (isProcessingRef.current) {
      logDebug(`⏳ 処理中、イベントを保留: [${boundaryId}]`);
      pendingBoundaryCrossRef.current = { boundaryId, direction };
      return;
    }

    // 処理実行
    isProcessingRef.current = true;
    lastProcessTimeRef.current = now;
    lastBoundaryTriggerRef.current[boundaryId] = now;
    consecutiveTriggerCountRef.current[boundaryId] = consecutiveCount + 1;
    
    logDebug(`🔄 境界線通過処理実行: [${boundaryId}] (${consecutiveCount + 1}回目)`, {
      direction,
      timeSinceLastTrigger,
      consecutiveCount: consecutiveCount + 1
    });
    
    isUpdatingSetsRef.current = true;

    // スクロール位置補正のためのフラグをセット
    scrollAdjustmentRef.current = { direction };

    if (direction === 'up') {
      actions.addSetToTopAndRemoveFromBottom();
    } else {
      actions.addSetToBottomAndRemoveFromTop();
    }

    setTimeout(() => {
      isProcessingRef.current = false;
      logDebug(`✅ 処理完了フラグリセット: [${boundaryId}]`);
      
      // 成功した場合は連続カウンターをリセット
      consecutiveTriggerCountRef.current[boundaryId] = 0;
      
      if (pendingBoundaryCrossRef.current) {
        logDebug(`🔄 保留イベントを実行: [${pendingBoundaryCrossRef.current.boundaryId}]`);
        const { boundaryId: pendingId, direction: pendingDir } = pendingBoundaryCrossRef.current;
        pendingBoundaryCrossRef.current = null;
        handleBoundaryCross(pendingId, pendingDir);
      }
    }, 200);
    
    setTimeout(() => {
      isUpdatingSetsRef.current = false;
    }, 100);
  };

  useEffect(() => {
    if (state.currentStep === 'step1' && state.isLoading) {
      actions.initializeStep1(images);
    }
  }, [images, state.currentStep, state.isLoading, actions]);

  useEffect(() => {
    if (state.currentStep === 'step2') {
      actions.completeStep2();
    }
  }, [state.currentStep, actions]);

  useEffect(() => {
    if (state.currentStep === 'step3' && state.imageSet.length > 0) {
      actions.measureStep3();
    }
  }, [state.currentStep, state.imageSet.length, actions]);

  useEffect(() => {
    if (state.currentStep === 'step4' && state.setHeight > 0) {
      actions.enableStep4();
    }
  }, [state.currentStep, state.setHeight, actions]);

  useEffect(() => {
    if (state.currentStep === 'completed' && !isCenteredRef.current) {
      setTimeout(() => {
        scrollToCenter();
        logDebug('🎯 コンテンツを中央に配置しました');
        isCenteredRef.current = true;
        setTimeout(() => {
          canObserverLogRef.current = true;
          logDebug('🔬 境界の監視を開始しました');
        }, 200);
      }, 0);
    }
  }, [state.currentStep, scrollToCenter, logDebug]);

  // 🔥 改善: IntersectionObserverの設定を最適化
  useEffect(() => {
    if (state.currentStep !== 'completed') return;
    
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!canObserverLogRef.current) return;
          const scrollContainer = contentRef.current;
          if (!scrollContainer) return;
          
          entries.forEach((entry) => {
            const boundaryId = entry.target.id;
            const direction = getScrollDirection();
            
            // 🔥 改善: より厳密な交差判定
            const isActuallyIntersecting = entry.isIntersecting && entry.intersectionRatio > 0;
            
            if (isActuallyIntersecting) {
              if (boundaryId === `boundary-top-${side}` && (direction === 'up' || scrollContainer.scrollTop < 10)) {
                logDebug(`🎯 接触 -> 境界 [${boundaryId}] (上方向)`, {
                  intersectionRatio: entry.intersectionRatio,
                  scrollTop: scrollContainer.scrollTop
                });
                handleBoundaryCross(boundaryId, 'up');
              } else if (boundaryId === `boundary-bottom-${side}`) {
                const isAtBottom = Math.abs(scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight) < 10;
                if (direction === 'down' || isAtBottom) {
                  logDebug(`🎯 接触 -> 境界 [${boundaryId}] (下方向)`, {
                    intersectionRatio: entry.intersectionRatio,
                    isAtBottom
                  });
                  handleBoundaryCross(boundaryId, 'down');
                }
              }
            } else {
              if (isUpdatingSetsRef.current) return;
              if (boundaryId.startsWith(`boundary-set-${side}-`) && direction) {
                logDebug(`通過 -> 境界 [${boundaryId}] (${direction === 'down' ? '下' : '上'}方向)`, {
                  scrollTop: contentRef.current?.scrollTop || 0,
                  intersectionRatio: entry.intersectionRatio
                });
                handleBoundaryCross(boundaryId, direction);
              }
            }
          });
        },
        {
          root: contentRef.current,
          threshold: [0, 0.1], // 🔥 改善: 複数のthresholdで精密な検知
          rootMargin: '50px 0px' // 🔥 改善: rootMarginを縮小して過敏な反応を抑制
        }
      );
    }
    
    const observer = observerRef.current;
    observer.disconnect();
    const boundaries = document.querySelectorAll(`[id^="boundary-"]`);
    boundaries.forEach((boundary) => observer.observe(boundary));
    
    logDebug(`🔄 境界線監視を更新: ${boundaries.length}個の境界線を監視中`, {
      rootMargin: '50px 0px',
      threshold: [0, 0.1],
      cooldownTime: BOUNDARY_COOLDOWN,
      maxConsecutive: MAX_CONSECUTIVE_TRIGGERS
    });
    
    return () => {
      observer.disconnect();
    };
  }, [state.currentSets, state.currentStep, side]);

  // 無限スクロールの暴走を防ぐため、セット追加後にスクロール位置を補正する
  useEffect(() => {
    if (scrollAdjustmentRef.current?.direction && contentRef.current && state.setHeight > 0) {
      const { direction } = scrollAdjustmentRef.current;
      const { setHeight } = state;
      const scrollContainer = contentRef.current;

      if (direction === 'up') {
        // 上にセットが追加された場合、セットの高さ分だけ下にスクロールして視点を維持
        const previousScrollTop = scrollContainer.scrollTop;
        scrollContainer.scrollTop = previousScrollTop + setHeight;
        logDebug(`↕️ スクロール位置補正 (上追加): +${setHeight}px`, { from: previousScrollTop, to: scrollContainer.scrollTop });
      } else {
        // 下にセットが追加された場合（＝上からセットが削除された）、セットの高さ分だけ上にスクロール
        const previousScrollTop = scrollContainer.scrollTop;
        scrollContainer.scrollTop = previousScrollTop - setHeight;
        logDebug(`↕️ スクロール位置補正 (下追加): -${setHeight}px`, { from: previousScrollTop, to: scrollContainer.scrollTop });
      }

      // 補正が完了したらフラグをリセット
      scrollAdjustmentRef.current = null;
    }
  }, [state.currentSets, state.setHeight, contentRef]);

  return {
    state,
    actions,
    contentRef,
    addForce,
    scrollToCenter,
    debugScrollTop,
    setLastTotalDelta,
    lastTotalDelta,
    handleDebugClick,
    isProcessingRef,
    observerRef
  };
};