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

  const handleBoundaryCross = (boundaryId: string, direction: 'up' | 'down') => {
    if (isProcessingRef.current) {
      logDebug(`⏳ 処理中、イベントを保留: [${boundaryId}]`);
      pendingBoundaryCrossRef.current = { boundaryId, direction };
      return;
    }
    isProcessingRef.current = true;
    lastProcessTimeRef.current = Date.now();
    logDebug(`🔄 境界線通過処理実行: [${boundaryId}]`);
    isUpdatingSetsRef.current = true;
    if (direction === 'up') {
      actions.addSetToTopAndRemoveFromBottom();
    } else {
      actions.addSetToBottomAndRemoveFromTop();
    }
    setTimeout(() => {
      isProcessingRef.current = false;
      logDebug(`✅ 処理完了フラグリセット: [${boundaryId}]`);
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
            if (entry.isIntersecting) {
              if (boundaryId === `boundary-top-${side}` && (direction === 'up' || scrollContainer.scrollTop < 10)) {
                logDebug(`🎯 接触 -> 境界 [${boundaryId}] (上方向)`);
                handleBoundaryCross(boundaryId, 'up');
              } else if (boundaryId === `boundary-bottom-${side}`) {
                const isAtBottom = Math.abs(scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight) < 10;
                if (direction === 'down' || isAtBottom) {
                  logDebug(`🎯 接触 -> 境界 [${boundaryId}] (下方向)`);
                  handleBoundaryCross(boundaryId, 'down');
                }
              }
            } else {
              if (isUpdatingSetsRef.current) return;
              if (boundaryId.startsWith(`boundary-set-${side}-`) && direction) {
                logDebug(`通過 -> 境界 [${boundaryId}] (${direction === 'down' ? '下' : '上'}方向) (スクロール位置: ${contentRef.current?.scrollTop || 0})`);
                handleBoundaryCross(boundaryId, direction);
              }
            }
          });
        },
        {
          root: contentRef.current,
          threshold: 0,
          rootMargin: '100px 0px'
        }
      );
    }
    const observer = observerRef.current;
    observer.disconnect();
    const boundaries = document.querySelectorAll(`[id^="boundary-"]`);
    boundaries.forEach((boundary) => observer.observe(boundary));
    logDebug(`🔄 境界線監視を更新: ${boundaries.length}個の境界線を監視中`);
    return () => {
      observer.disconnect();
    };
  }, [state.currentSets, state.currentStep, side]);

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