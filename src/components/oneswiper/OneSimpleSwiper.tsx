import { useEffect, useRef } from 'react';
import { useSwiperSteps } from './useSwiperSteps';
import { useOneLayerController } from './useOneLayerController';
import { ScrollLayer } from './ScrollLayer';

interface OneSimpleSwiperProps {
  images: string[];
  setCount?: number;
}

export const OneSimpleSwiper = ({ images, setCount = 5 }: OneSimpleSwiperProps) => {
  const [state, actions] = useSwiperSteps();
  const { contentRef, handleScrollLayerMove, scrollToCenter } = useOneLayerController();
  const isCenteredRef = useRef(false);
  const canObserverLogRef = useRef(false);
  const lastScrollTopRef = useRef(0);

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

  // 境界の表示監視
  useEffect(() => {
    if (state.currentStep !== 'completed') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 監視が有効になるまでログを出力しない
        if (!canObserverLogRef.current) return;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            const direction = getScrollDirection();
            const directionText = direction ? `(${direction === 'down' ? '下' : '上'}方向)` : '';
            logDebug(`通過 -> 境界 [${entry.target.id}] ${directionText}`);
          }
        });
      },
      {
        root: null, // ビューポートを基準にする
        threshold: 0, // 少しでも表示されたらトリガー
      }
    );

    const boundaries = document.querySelectorAll('[id^="boundary-"]');
    boundaries.forEach((boundary) => observer.observe(boundary));

    // クリーンアップ
    return () => {
      boundaries.forEach((boundary) => observer.unobserve(boundary));
      observer.disconnect();
      canObserverLogRef.current = false;
    };
  }, [state.currentStep, logDebug]);

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
          <div>画像数: {state.imageSet.length}</div>
          <div>ScrollLayer: {state.currentStep === 'completed' ? '✅ 有効' : '❌ 待機'}</div>
          <div>クリック有効: ✅</div>
        </div>
      )}

      {/* ScrollLayer（Step 4完了後に有効化） */}
      <ScrollLayer 
        onScroll={handleScrollLayerMove}
        height={state.setHeight}
        setCount={setCount}
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
            className="w-full h-1 bg-red-500 opacity-70" 
               style={{ pointerEvents: 'none' }} />
        )}

        {/* Step 2完了後: 最初のセット（高さ測定用） */}
        {(state.currentStep === 'step3' || state.currentStep === 'step4' || state.currentStep === 'completed') && (
          <div 
            id="set-1"
            className="measurement-set relative w-full">
            {state.imageSet.map((src, imageIndex) => (
              <div 
                key={`set1-${imageIndex}`}
                className="relative w-full cursor-pointer"
                onClick={() => handleDebugClick(1, imageIndex, src)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleDebugClick(1, imageIndex, src);
                }}
              >
                <img 
                  src={src} 
                  alt={`Set 1, Image ${imageIndex + 1}`}
                  className="w-full h-auto block"
                  loading="eager"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 画像要素クリックログは削除（頻度が高すぎるため）
                    handleDebugClick(1, imageIndex, src);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 3完了後: 残りのセット（セット間境界線付き） */}
        {(state.currentStep === 'completed') && state.setHeight > 0 && 
          Array(setCount - 1).fill(0).map((_, setIndex) => {
            const actualSetNumber = setIndex + 2;
            return (
              <div key={`set-container-${actualSetNumber}`}>
                {/* セット間境界線 */}
                {state.showBoundaries && (
                  <div 
                    id={`boundary-set-${actualSetNumber}`}
                    className="w-full h-1 bg-red-500 opacity-70" 
                       style={{ pointerEvents: 'none' }} />
                )}
                
                {/* セット本体 */}
                <div 
                  id={`set-${actualSetNumber}`}
                  className="relative w-full">
                  {state.imageSet.map((src, imageIndex) => (
                    <div 
                      key={`set${actualSetNumber}-${imageIndex}`}
                      className="relative w-full cursor-pointer"
                      onClick={() => handleDebugClick(actualSetNumber, imageIndex, src)}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleDebugClick(actualSetNumber, imageIndex, src);
                      }}
                    >
                      <img 
                        src={src} 
                        alt={`Set ${actualSetNumber}, Image ${imageIndex + 1}`}
                        className="w-full h-auto block"
                        loading="lazy"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 画像要素クリックログは削除（頻度が高すぎるため）
                          handleDebugClick(actualSetNumber, imageIndex, src);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        }

        {/* Step 4完了後: 下端境界線（最後のセットの後） */}
        {state.showBoundaries && state.currentStep === 'completed' && (
          <div 
            id="boundary-bottom"
            className="w-full h-1 bg-red-500 opacity-70" 
               style={{ pointerEvents: 'none' }} />
        )}
      </div>
    </div>
  );
};