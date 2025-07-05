import { useSwiperController } from '../hooks/useSwiperController';
import { ScrollLayer } from './ScrollLayer';
import { useEffect } from 'react';

interface OneSimpleSwiperProps {
  images: string[];
  setCount?: number;
  side: 'left' | 'right';
}

export const OneSimpleSwiper: React.FC<OneSimpleSwiperProps> = ({ images, setCount = 5, side }) => {
  const {
    state,
    actions,
    contentRef,
    addForce,
    debugScrollTop,
    setLastTotalDelta,
    lastTotalDelta,
    handleDebugClick,
    isProcessingRef,
    observerRef
  } = useSwiperController(images, side);

  // スクロール位置を定期的にコンソールに出力（必ずトップレベルで呼ぶ）
  useEffect(() => {
    const interval = setInterval(() => {
      if (contentRef.current) {
        const scrollTop = Math.round(contentRef.current.scrollTop);
        const clientHeight = Math.round(contentRef.current.clientHeight);
        const scrollHeight = Math.round(contentRef.current.scrollHeight);
        console.log(
          `[${side}] 表示位置: scrollTop=${scrollTop} px, clientHeight=${clientHeight} px, scrollHeight=${scrollHeight} px, 表示範囲: ${scrollTop} ~ ${scrollTop + clientHeight} px`
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [contentRef, side]);

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
        <div className={`fixed top-0 ${side === 'left' ? 'left-0' : 'right-0'} bg-black/90 text-white p-3 text-xs z-50 font-mono`}>
          <div className="text-green-400">🎯 OneSimpleSwiper デバッグ</div>
          <div>現在のステップ: {state.currentStep}</div>
          <div>1セット高さ: {state.setHeight}px</div>
          <div>画像数/セット: {state.imageSet.length}</div>
          <div>表示セット数: {state.currentSets.length}</div>
          <div>セットカウンター: {state.setCounter}</div>
          <div>ScrollLayer: {state.currentStep === 'completed' ? '✅ 有効' : '❌ 待機'}</div>
          <div>クリック有効: ✅</div>
          <div className="border-t border-gray-600 mt-2 pt-2">
            <div className="text-pink-400">🪟 スクロール状態</div>
            <div>scrollTop: {contentRef.current ? Math.round(contentRef.current.scrollTop) : 'N/A'} px</div>
            <div>clientHeight: {contentRef.current ? Math.round(contentRef.current.clientHeight) : 'N/A'} px</div>
            <div>scrollHeight: {contentRef.current ? Math.round(contentRef.current.scrollHeight) : 'N/A'} px</div>
            <div>表示範囲: {contentRef.current ? `${Math.round(contentRef.current.scrollTop)} ~ ${Math.round(contentRef.current.scrollTop + contentRef.current.clientHeight)}` : 'N/A'} px</div>
            <div>端判定: {
              contentRef.current
                ? (contentRef.current.scrollTop <= 0
                    ? '⬆️ 上端'
                    : (contentRef.current.scrollTop + contentRef.current.clientHeight >= contentRef.current.scrollHeight - 1
                        ? '⬇️ 下端'
                        : '◀️ 中間'))
                : 'N/A'
            }</div>
          </div>
          <div className="border-t border-gray-600 mt-2 pt-2">
            <div className="text-yellow-400">🔄 制御状態</div>
            <div>処理中: {isProcessingRef.current ? '⏳ 処理中' : '✅ 待機中'}</div>
            <div>スクロール位置: {Math.round(debugScrollTop)}px</div>
            <div>最終移動量: {lastTotalDelta}px</div>
            <div>コンテナ高: {contentRef.current?.scrollHeight || 0}px</div>
            <div>ScrollLayer高: {state.setHeight * setCount}px</div>
            <div>境界線数: {observerRef.current ? document.querySelectorAll('[id^="boundary-"]').length : 0}</div>
            <div>監視状態: {observerRef.current ? '✅ 監視中' : '❌ 停止中'}</div>
          </div>
          {/* 🔥 追加: 境界要素の安定性情報 */}
          <div className="border-t border-gray-600 mt-2 pt-2">
            <div className="text-blue-400">🛡️ 境界安定化</div>
            <div>クールダウン: 500ms</div>
            <div>最大連続: 3回</div>
            <div>rootMargin: 50px</div>
            <div>threshold: [0, 0.1]</div>
          </div>
        </div>
      )}

      {/* ScrollLayer（Step 4完了後に有効化） */}
      <ScrollLayer 
        side={side}
        onWheelDelta={addForce}
        onScrollEnd={setLastTotalDelta}
        height={state.setHeight}
        isEnabled={state.currentStep === 'completed' && state.setHeight > 0}
      />

      {/* コンテンツレイヤー */}
      <div 
        ref={contentRef}
        className="w-full h-full overflow-y-auto hide-scrollbar"
        data-content-layer="true"
        style={{ 
          zIndex: 0,
          pointerEvents: 'auto' // 常にクリックイベントを有効にする
        }}
      >
        {/* 動的セット表示 */}
        {state.currentSets.map((set, setIndex) => (
          <div key={`set-container-${set.id}`}>
            {/* セット間境界線（最初のセット以外） */}
            {state.showBoundaries && setIndex > 0 && (
              <div 
                id={`boundary-set-${side}-${set.setNumber}`}
                className="w-full bg-red-500 opacity-70" 
                style={{ 
                  pointerEvents: 'none',
                  height: '5px' // 🔥 改善: セット間境界も縮小
                }} 
              />
                )}
                
                {/* セット本体 */}
            <div 
              id={`set-${side}-${set.setNumber}`}
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
                      handleDebugClick(set.setNumber, imageIndex, src);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
        ))}
      </div>
    </div>
  );
};