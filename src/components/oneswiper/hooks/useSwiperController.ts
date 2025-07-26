import { useEffect, useRef, useState } from 'react';
import { useSwiperSteps } from './useSwiperSteps';
import { useInertiaController } from './useInertiaController';

export const useSwiperController = (images: string[], side: 'left' | 'right') => {
  const [state, actions] = useSwiperSteps(side);
  const [debugScrollTop, setDebugScrollTop] = useState(0);
  const onScrollForDebug = process.env.NODE_ENV === 'development' ? setDebugScrollTop : undefined;
  const { contentRef, addForce, scrollToCenter, velocityRef } = useInertiaController(
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
  const scrollAdjustmentRef = useRef<{ direction: 'up' | 'down' } | null>(null);
  
  // 🆕 画像変更検知用の参照を追加
  const previousImagesRef = useRef<string[]>([]);

  // 🔥 追加: 境界要素の無限ロード防止機能
  const lastBoundaryTriggerRef = useRef<{ [key: string]: number }>({});
  const BOUNDARY_COOLDOWN = 500; // 500ms のクールダウン時間
  const consecutiveTriggerCountRef = useRef<{ [key: string]: number }>({});
  const MAX_CONSECUTIVE_TRIGGERS = 3; // 連続トリガーの最大回数

  // 🔥 追加: 端境界の可視時間監視機能
  const topBoundaryVisibleTimeRef = useRef(0);
  const bottomBoundaryVisibleTimeRef = useRef(0);
  const lastBoundaryCheckTimeRef = useRef(Date.now());
  const isProcessingTopBoundaryRef = useRef(false);
  const isProcessingBottomBoundaryRef = useRef(false);
  const BOUNDARY_VISIBLE_THRESHOLD = 100; // 100ms見え続けたら発火（500msから短縮）
  const BOUNDARY_CHECK_INTERVAL = 100; // 100ms間隔でチェック
  const ROOT_MARGIN = '50px 0px'; // IntersectionObserverのrootMargin
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

    // 🔥 変更: 他の処理中はスキップ（保留しない）
    if (isProcessingRef.current) {
      logDebug(`⏳ 処理中、スキップ: [${boundaryId}]`);
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
    }, 200);
    
    setTimeout(() => {
      isUpdatingSetsRef.current = false;
    }, 100);
  };

  // 🔥 追加: 端境界の可視時間監視機能
  const checkBoundaryVisibility = () => {
    if (!contentRef.current || state.currentStep !== 'completed') return;
    
    const now = Date.now();
    const deltaTime = now - lastBoundaryCheckTimeRef.current;
    lastBoundaryCheckTimeRef.current = now;
    
    const scrollContainer = contentRef.current;
    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;
    
    // 上端境界の可視性チェック
    const isAtTop = scrollTop < 100;
    if (isAtTop) {
      topBoundaryVisibleTimeRef.current += deltaTime;
      if (topBoundaryVisibleTimeRef.current > BOUNDARY_VISIBLE_THRESHOLD && !isProcessingTopBoundaryRef.current) {
        logDebug(`⏰ 上端境界が${BOUNDARY_VISIBLE_THRESHOLD}ms見え続けました`, {
          visibleTime: topBoundaryVisibleTimeRef.current,
          scrollTop,
          scrollHeight,
          clientHeight
        });
        handleTopBoundaryReached();
        topBoundaryVisibleTimeRef.current = 0; // リセット
      }
    } else {
      topBoundaryVisibleTimeRef.current = 0; // 見えなくなったらリセット
    }
    
    // 下端境界の可視性チェック
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 100;
    if (isAtBottom) {
      bottomBoundaryVisibleTimeRef.current += deltaTime;
      if (bottomBoundaryVisibleTimeRef.current > BOUNDARY_VISIBLE_THRESHOLD && !isProcessingBottomBoundaryRef.current) {
        logDebug(`⏰ 下端境界が${BOUNDARY_VISIBLE_THRESHOLD}ms見え続けました`, {
          visibleTime: bottomBoundaryVisibleTimeRef.current,
          scrollTop,
          scrollHeight,
          clientHeight
        });
        handleBottomBoundaryReached();
        bottomBoundaryVisibleTimeRef.current = 0; // リセット
      }
    } else {
      bottomBoundaryVisibleTimeRef.current = 0; // 見えなくなったらリセット
    }
  };

  // 🔥 追加: 上端境界到達ハンドラー
  const handleTopBoundaryReached = () => {
    if (isProcessingTopBoundaryRef.current) {
      logDebug(`⏳ 上端境界処理中、スキップ`);
      return;
    }
    
    isProcessingTopBoundaryRef.current = true;
    logDebug(`🔄 上端境界到達処理開始`);
    
    isUpdatingSetsRef.current = true;
    scrollAdjustmentRef.current = { direction: 'up' };
    actions.addSetToTopAndRemoveFromBottom();
    
    setTimeout(() => {
      isProcessingTopBoundaryRef.current = false;
      logDebug(`✅ 上端境界処理完了`);
    }, 200);
    
    setTimeout(() => {
      isUpdatingSetsRef.current = false;
    }, 100);
  };

  // 🔥 追加: 下端境界到達ハンドラー
  const handleBottomBoundaryReached = () => {
    if (isProcessingBottomBoundaryRef.current) {
      logDebug(`⏳ 下端境界処理中、スキップ`);
      return;
    }
    
    isProcessingBottomBoundaryRef.current = true;
    logDebug(`🔄 下端境界到達処理開始`);
    
    isUpdatingSetsRef.current = true;
    scrollAdjustmentRef.current = { direction: 'down' };
    actions.addSetToBottomAndRemoveFromTop();
    
    setTimeout(() => {
      isProcessingBottomBoundaryRef.current = false;
      logDebug(`✅ 下端境界処理完了`);
    }, 200);
    
    setTimeout(() => {
      isUpdatingSetsRef.current = false;
    }, 100);
  };

  // 🆕 修正版: 画像変更検知と初期化処理
  useEffect(() => {
    // 画像配列の内容が変更されたかチェック
    const imagesChanged = 
      images.length !== previousImagesRef.current.length ||
      images.some((img, index) => img !== previousImagesRef.current[index]);

    if (images.length > 0 && imagesChanged) {
      // 画像が変更された場合はリセットして再初期化
      if (state.currentStep !== 'step1' || !state.isLoading) {
        actions.reset(); // 初期化済みの場合のみリセット
        logDebug('🔄 画像配列変更によりリセット', {
          newImageCount: images.length,
          previousCount: previousImagesRef.current.length,
          side
        });
      }
      
      // 参照を更新
      previousImagesRef.current = [...images];
    }

    // 通常の初期化処理
    if (state.currentStep === 'step1' && state.isLoading) {
      actions.initializeStep1(images);
    }
  }, [images, state.currentStep, state.isLoading, actions, side]);

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
            
            // 端境界のデバッグ情報（処理は行わない）
            if (boundaryId === `boundary-top-${side}` || boundaryId === `boundary-bottom-${side}`) {
              const scrollTop = scrollContainer.scrollTop;
              const scrollHeight = scrollContainer.scrollHeight;
              const clientHeight = scrollContainer.clientHeight;
              const isAtTop = scrollTop < 10;
              const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
              
              logDebug(`🔍 端境界デバッグ [${boundaryId}]`, {
                isIntersecting: entry.isIntersecting,
                intersectionRatio: entry.intersectionRatio,
                isActuallyIntersecting,
                scrollTop,
                scrollHeight,
                clientHeight,
                isAtTop,
                isAtBottom,
                direction: direction || '静止'
              });
            }
            
            // 🔥 変更: 端境界はIntersectionObserverでは処理しない（可視時間監視に委譲）
            if (isActuallyIntersecting) {
              // 🔥 追加: 端境界処理中はセット間境界の処理をスキップ
              const isProcessingBoundary = isProcessingTopBoundaryRef.current || isProcessingBottomBoundaryRef.current;
              if (isProcessingBoundary) {
                logDebug(`⏳ 端境界処理中、セット間境界をスキップ: [${boundaryId}]`);
                return;
              }
              
              if (boundaryId.startsWith(`boundary-set-${side}-`) && direction) {
                logDebug(`通過 -> セット境界 [${boundaryId}] (${direction === 'down' ? '下' : '上'}方向)`, {
                  scrollTop: contentRef.current?.scrollTop || 0,
                  intersectionRatio: entry.intersectionRatio
                });
                handleBoundaryCross(boundaryId, direction);
              }
            } else {
              // 端境界は「到達」のみで「離脱」は処理しない
              if (isUpdatingSetsRef.current) return;
              
              // 🔥 追加: 端境界処理中はセット間境界の処理をスキップ
              const isProcessingBoundary = isProcessingTopBoundaryRef.current || isProcessingBottomBoundaryRef.current;
              if (isProcessingBoundary) {
                logDebug(`⏳ 端境界処理中、セット間境界をスキップ: [${boundaryId}]`);
                return;
              }
              
              if (boundaryId.startsWith(`boundary-set-${side}-`) && direction) {
                logDebug(`通過 -> セット境界 [${boundaryId}] (${direction === 'down' ? '下' : '上'}方向)`, {

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
          rootMargin: ROOT_MARGIN // 🔥 改善: rootMarginを縮小して過敏な反応を抑
        }
      );
    }
    
    const observer = observerRef.current;
    observer.disconnect();
    const boundaries = document.querySelectorAll(`[id^="boundary-"]`);
    boundaries.forEach((boundary) => observer.observe(boundary));
    
    logDebug(`🔄 境界線監視を更新: ${boundaries.length}個の境界線を監視中`, {
      rootMargin: ROOT_MARGIN,
      threshold: [0, 0.1],
      cooldownTime: BOUNDARY_COOLDOWN,
      maxConsecutive: MAX_CONSECUTIVE_TRIGGERS
    });
    
    return () => {
      observer.disconnect();
    };
  }, [state.currentSets, state.currentStep, side]);

  // 🔥 追加: 端境界の可視時間監視を定期的に実行
  useEffect(() => {
    if (state.currentStep !== 'completed') return;
    
    const interval = setInterval(() => {
      checkBoundaryVisibility();
    }, BOUNDARY_CHECK_INTERVAL);
    
    logDebug(`⏰ 端境界可視時間監視開始`, {
      checkInterval: BOUNDARY_CHECK_INTERVAL,
      visibleThreshold: BOUNDARY_VISIBLE_THRESHOLD
    });
    
    return () => {
      clearInterval(interval);
      logDebug(`⏰ 端境界可視時間監視停止`);
    };
  }, [state.currentStep]);

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
    observerRef,
    velocityRef
  };
};