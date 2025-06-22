import { useEffect, useRef, useState } from 'react';
import { useSwiperSteps } from './useSwiperSteps';
import { useInertiaController } from './useInertiaController';
import { ScrollLayer } from './ScrollLayer';

interface OneSimpleSwiperProps {
  images: string[];
  setCount?: number;
}

export const OneSimpleSwiper = ({ images, setCount = 5 }: OneSimpleSwiperProps) => {
  const [state, actions] = useSwiperSteps();
  const [debugScrollTop, setDebugScrollTop] = useState(0); // デバッグ用のスクロール位置

  // 開発モードの時だけ、スクロール位置をリアルタイムで受け取るコールバックを渡す
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

  // ログ出力用のヘルパー関数
  const logDebug = (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, data);
    }
  };

  // スクロール方向を取得する関数
  const getScrollDirection = (): 'up' | 'down' | null => {
    if (!contentRef.current) return null;
    
    const currentScrollTop = contentRef.current.scrollTop;
    const direction = currentScrollTop > lastScrollTopRef.current ? 'down' : 'up';
    lastScrollTopRef.current = currentScrollTop;
    
    return direction;
  };

  // 画像クリック/タッチ処理
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
    
    // アラートで画像名を表示（テスト用）
    alert(`クリックされた画像: ${imageName}\nセット: ${setIndex}, 画像: ${imageIndex + 1}`);
    
    // ここで画像クリックの具体的な処理を実装
    // 例: モーダル表示、詳細ページ遷移、等
  };

  // デバッグ用：クリックイベントの発火確認
  const handleDebugClick = (setIndex: number, imageIndex: number, src: string) => {
    logDebug('🔍 デバッグ: クリックイベント発火', {
      set: setIndex,
      image: imageIndex + 1,
      src: src.split('/').pop()
    });
    handleImageClick(setIndex, imageIndex, src);
  };

  // 境界線通過処理（リファクタリング版）
  const handleBoundaryCross = (boundaryId: string, direction: 'up' | 'down') => {
    // 処理中に新しいイベントが来た場合は、最新のイベントを記憶して後で処理する
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

      // 保留中のイベントがあれば処理する
      if (pendingBoundaryCrossRef.current) {
        logDebug(`🔄 保留イベントを実行: [${pendingBoundaryCrossRef.current.boundaryId}]`);
        const { boundaryId: pendingId, direction: pendingDir } = pendingBoundaryCrossRef.current;
        pendingBoundaryCrossRef.current = null; // 必ず先にクリアする
        handleBoundaryCross(pendingId, pendingDir);
      }
    }, 200);

    setTimeout(() => {
      isUpdatingSetsRef.current = false;
    }, 100);
  };

  // 初期化トリガー
  useEffect(() => {
    if (state.currentStep === 'step1' && state.isLoading) {
      actions.initializeStep1(images);
    }
  }, [images, state.currentStep, state.isLoading, actions]);

  // Step 2 自動進行
  useEffect(() => {
    if (state.currentStep === 'step2') {
      actions.completeStep2();
    }
  }, [state.currentStep, actions]);

  // Step 3 自動進行（DOM準備後）
  useEffect(() => {
    if (state.currentStep === 'step3' && state.imageSet.length > 0) {
      actions.measureStep3();
    }
  }, [state.currentStep, state.imageSet.length, actions]);

  // Step 4 自動進行
  useEffect(() => {
    if (state.currentStep === 'step4' && state.setHeight > 0) {
      actions.enableStep4();
    }
  }, [state.currentStep, state.setHeight, actions]);

  // Step 完了後: コンテンツを中央に配置
  useEffect(() => {
    if (state.currentStep === 'completed' && !isCenteredRef.current) {
      // DOMの更新が完了した後に中央配置を実行
      setTimeout(() => {
        scrollToCenter();
        logDebug('🎯 コンテンツを中央に配置しました');
        isCenteredRef.current = true;

        // 初期スクロールが完了してから監視を有効化
        setTimeout(() => {
          canObserverLogRef.current = true;
          logDebug('🔬 境界の監視を開始しました');
        }, 200); // スクロールが落ち着くのを待つ
      }, 0);
    }
  }, [state.currentStep, scrollToCenter, logDebug]);

  // 境界線の動的監視
  useEffect(() => {
    if (state.currentStep !== 'completed') return;

    // Observerの初期化（初回のみ）
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!canObserverLogRef.current) return;

          const scrollContainer = contentRef.current;
          if (!scrollContainer) return;

          entries.forEach((entry) => {
            const boundaryId = entry.target.id;
            const direction = getScrollDirection();
            
            // 上下の境界は「画面内に入った時」に処理
            if (entry.isIntersecting) {
              if (boundaryId === 'boundary-top' && (direction === 'up' || scrollContainer.scrollTop < 10)) {
                logDebug(`🎯 接触 -> 境界 [${boundaryId}] (上方向)`);
                handleBoundaryCross(boundaryId, 'up');
              } else if (boundaryId === 'boundary-bottom') {
                const isAtBottom = Math.abs(scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight) < 10;
                if (direction === 'down' || isAtBottom) {
                  logDebug(`🎯 接触 -> 境界 [${boundaryId}] (下方向)`);
                  handleBoundaryCross(boundaryId, 'down');
                }
              }
            }
            // セット間の境界は「画面外に出た時」に処理
            else {
              // DOM更新直後のイベントの嵐をここで防ぐ
              if (isUpdatingSetsRef.current) return;

              if (boundaryId.startsWith('boundary-set-') && direction) {
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

    // 既存の監視をすべて解除
    observer.disconnect();

    // 現在表示されている境界線をすべて監視対象に追加
    const boundaries = document.querySelectorAll('[id^="boundary-"]');
    boundaries.forEach((boundary) => observer.observe(boundary));
    logDebug(`🔄 境界線監視を更新: ${boundaries.length}個の境界線を監視中`);

    // コンポーネントのアンマウント時に監視を停止
    return () => {
      observer.disconnect();
    };
  }, [state.currentSets, state.currentStep]); // セットまたはステップが変更されるたびに実行

  // ローディング中
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            Step 1: Loading {images.length} images...
          </p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (state.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-lg mb-2">初期化エラー</p>
          <p className="text-sm">{state.error}</p>
          <button 
            onClick={actions.reset}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            リトライ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 bg-black/90 text-white p-3 text-xs z-50 font-mono">
          <div className="text-green-400">🎯 OneSimpleSwiper デバッグ</div>
          <div>現在のステップ: {state.currentStep}</div>
          <div>1セット高さ: {state.setHeight}px</div>
          <div>画像数/セット: {state.imageSet.length}</div>
          <div>表示セット数: {state.currentSets.length}</div>
          <div>セットカウンター: {state.setCounter}</div>
          <div>ScrollLayer: {state.currentStep === 'completed' ? '✅ 有効' : '❌ 待機'}</div>
          <div>クリック有効: ✅</div>
          <div className="border-t border-gray-600 mt-2 pt-2">
            <div className="text-yellow-400">🔄 制御状態</div>
            <div>処理中: {isProcessingRef.current ? '⏳ 処理中' : '✅ 待機中'}</div>
            <div>スクロール位置: {Math.round(debugScrollTop)}px</div>
            <div>最終移動量: {lastTotalDelta}px</div>
            <div>コンテナ高: {contentRef.current?.scrollHeight || 0}px</div>
            <div>ScrollLayer高: {state.setHeight * setCount}px</div>
            <div>境界線数: {document.querySelectorAll('[id^="boundary-"]').length}</div>
            <div>監視状態: {observerRef.current ? '✅ 監視中' : '❌ 停止中'}</div>
          </div>
        </div>
      )}

      {/* ScrollLayer（Step 4完了後に有効化） */}
      <ScrollLayer 
        onWheelDelta={addForce}
        onScrollEnd={setLastTotalDelta}
        height={state.setHeight}
        isEnabled={state.currentStep === 'completed' && state.setHeight > 0}
      />

      {/* コンテンツレイヤー */}
      <div 
        ref={contentRef}
        className="w-full h-full overflow-y-auto"
        data-content-layer="true"
        style={{ 
          zIndex: 0,
          pointerEvents: 'auto' // 常にクリックイベントを有効にする
        }}
      >
        {/* Step 4完了後: 上端境界線（最初のセットの前） */}
        {state.showBoundaries && state.currentStep === 'completed' && (
          <div 
            id="boundary-top"
            className="w-full h-1 bg-red-500 opacity-50" 
               style={{ pointerEvents: 'none', height: '20px', marginBottom: '-19px' }} />
        )}

        {/* 動的セット表示 */}
        {state.currentSets.map((set, setIndex) => (
          <div key={`set-container-${set.id}`}>
            {/* セット間境界線（最初のセット以外） */}
            {state.showBoundaries && setIndex > 0 && (
              <div 
                id={`boundary-set-${set.setNumber}`}
                className="w-full h-1 bg-red-500 opacity-70" 
                       style={{ pointerEvents: 'none' }} />
                )}
                
                {/* セット本体 */}
            <div 
              id={`set-${set.setNumber}`}
              className={`relative w-full ${setIndex === 0 ? 'measurement-set' : ''}`}>
              {set.images.map((src, imageIndex) => (
                    <div 
                  key={`${set.id}-${imageIndex}`}
                      className="relative w-full cursor-pointer"
                  onClick={() => handleDebugClick(set.setNumber, imageIndex, src)}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                    handleDebugClick(set.setNumber, imageIndex, src);
                      }}
                    >
                      <img 
                        src={src} 
                    alt={`Set ${set.setNumber}, Image ${imageIndex + 1}`}
                        className="w-full h-auto block"
                    loading={setIndex === 0 ? "eager" : "lazy"}
                        onClick={(e) => {
                          e.stopPropagation();
                      // 画像要素クリックログは削除（頻度が高すぎるため）
                      handleDebugClick(set.setNumber, imageIndex, src);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
        ))}

        {/* Step 4完了後: 下端境界線（最後のセットの後） */}
        {state.showBoundaries && state.currentStep === 'completed' && (
          <div 
            id="boundary-bottom"
            className="w-full h-1 bg-red-500 opacity-50" 
               style={{ pointerEvents: 'none', height: '20px', marginTop: '-19px' }} />
        )}
      </div>
    </div>
  );
};