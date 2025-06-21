import React, { useRef, useEffect, useCallback } from 'react';

interface ScrollLayerProps {
  onScroll: (deltaY: number) => void; // 移動量を親に通知
  height?: number; // 1セットの高さ
  setCount?: number; // セット数
  isEnabled?: boolean; // 有効化フラグ
}

export const ScrollLayer = React.memo(function ScrollLayer({
  onScroll,
  height = 0,
  setCount = 1,
  isEnabled = false
}: ScrollLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  // 高速スクロール対応
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ログ出力用のヘルパー関数
  const logDebug = useCallback((message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, data);
    }
  }, []);

  // スクロールイベントハンドラー（スクロール検知のみ）
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isEnabled) return;
    
    const target = e.currentTarget;
    const currentScrollTop = target.scrollTop;
    const deltaY = currentScrollTop - lastScrollTopRef.current;
    
    if (deltaY !== 0) {
      onScroll(deltaY);
      // スクロールログは削除（頻度が高すぎるため）
    }
    
    lastScrollTopRef.current = currentScrollTop;
  }, [onScroll, isEnabled, height]);

  // ホイールイベント処理（スクロール専用）
  const handleWheelEvent = useCallback((e: React.WheelEvent) => {
    if (!containerRef.current || !isEnabled) return;

    e.stopPropagation();
    
    const container = containerRef.current;
    const deltaY = e.deltaY;
    
    const isHighSpeed = Math.abs(deltaY) > 150;
    let scrollAmount = deltaY;

    if (isHighSpeed) {
      scrollAmount = deltaY * 0.8;
      logDebug('🎡 ScrollLayer: ホイール高速スクロール検知', {
        deltaY,
        appliedAmount: scrollAmount,
      });
    }

    const currentScrollTop = container.scrollTop;
    const newScrollTop = currentScrollTop + scrollAmount;
    
    container.scrollTop = newScrollTop;
    lastScrollTopRef.current = newScrollTop;
    
    if (scrollAmount !== 0) {
      onScroll(scrollAmount);
    }
    
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
    }
    
    wheelTimeoutRef.current = setTimeout(() => {
      logDebug('⏱️ ScrollLayer: ホイール操作終了');
    }, 150);
    
  }, [onScroll, isEnabled, logDebug]);

  // 初期スクロール位置設定
  useEffect(() => {
    if (containerRef.current && height > 0 && isEnabled) {
      const container = containerRef.current;
      const centerPosition = container.scrollHeight / 2;
      
      container.scrollTo({
        top: centerPosition,
        behavior: 'auto'
      });
      
      lastScrollTopRef.current = centerPosition;
      
      logDebug('🎯 ScrollLayer: 初期化完了＆中央へ移動', {
        contentHeight: height,
        totalHeight: container.scrollHeight,
        centerPosition,
        enabled: isEnabled
      });
    }
  }, [height, isEnabled, logDebug]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, []);

  // Step完了前は非表示
  if (!isEnabled || height === 0) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 z-10" 
      style={{ pointerEvents: 'none' }}
    >
      {/* 透明スクロールエリア（スクロール専用、クリックは下層に伝播） */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
        onWheelCapture={handleWheelEvent}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const x = e.clientX;
          const y = e.clientY;
          const contentLayer = document.querySelector('[data-content-layer="true"]');
          if (contentLayer) {
            const images = contentLayer.querySelectorAll('img');
            for (const img of images) {
              const imgRect = img.getBoundingClientRect();
              if (x >= imgRect.left && x <= imgRect.right && y >= imgRect.top && y <= imgRect.bottom) {
                const parentDiv = img.closest('div[onClick]');
                if (parentDiv) {
                  (parentDiv as HTMLElement).click();
                } else {
                  (img as HTMLElement).click();
                }
                return;
              }
            }
          }
        }}
        style={{
          pointerEvents: 'auto',
          background: 'transparent'
        }}
      >
        {/* 仮想コンテンツ（スクロール用） */}
        <div 
          className="w-full"
          style={{ 
            height: `${height * setCount}px`,
            pointerEvents: 'none',
            background: 'transparent'
          }}
        />
      </div>
    </div>
  );
});