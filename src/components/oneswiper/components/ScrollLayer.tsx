import React, { useRef, useEffect, useCallback } from 'react';
import { useSwiperSyncController } from '../hooks/useSwiperSyncController';

interface ScrollLayerProps {
  side: 'left' | 'right'; // 追加
  onWheelDelta: (deltaY: number) => void; // ホイールの移動量を親に通知
  onScrollEnd?: (totalDelta: number) => void; // スクロール終了を通知
  height?: number; // 1セットの高さ
  isEnabled?: boolean; // 有効化フラグ
  onAutoScroll?: () => void; // オートスクロール速度取得用コールバック
}

export const ScrollLayer = React.memo(function ScrollLayer({
  side,
  onWheelDelta,
  onScrollEnd,
  height = 0,
  isEnabled = false,
  onAutoScroll
}: ScrollLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null); // スクロール可能なコンテンツへの参照
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedDeltaRef = useRef(0);
  const lastScrollTopRef = useRef(0); // 最後のスクロール位置を追跡
  const isScrollingRef = useRef(false); // スクロール中かどうか
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null); // スクロール終了タイマー
  const isSyncScrollingRef = useRef(false); // 同期スクロール中かどうか
  const syncScrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 同期スクロール終了タイマー

  // --- 追加: 同期コントローラー ---
  const { emitSync, onSync } = useSwiperSyncController({
    syncGroupId: 'main',
    layerId: side,
  });

  // ログ出力用のヘルパー関数
  const logDebug = useCallback((message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, data);
    }
  }, []);

  // ホイールイベント処理（スクロール専用）
  const handleWheelEvent = useCallback((e: WheelEvent) => {
    if (!isEnabled) return;

    e.preventDefault();
    e.stopPropagation();

    const deltaY = e.deltaY;
    onWheelDelta(deltaY);
    emitSync(deltaY); // --- 追加: 同期イベント発行 ---

    // ログ用の移動量を蓄積
    accumulatedDeltaRef.current += deltaY;
    
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
    }
    
    wheelTimeoutRef.current = setTimeout(() => {
      if (onScrollEnd) {
        onScrollEnd(accumulatedDeltaRef.current);
      }
      logDebug('↕️ ScrollLayer: ホイール操作完了', { totalDelta: accumulatedDeltaRef.current });
      accumulatedDeltaRef.current = 0;
    }, 150);
    
  }, [onWheelDelta, isEnabled, logDebug, onScrollEnd, emitSync]);

  // --- 追加: 他方からの同期イベント受信 ---
  useEffect(() => {
    const unsubscribe = onSync((event) => {
      // event.delta を使って自分のスクロール・スワイパーを更新
      onWheelDelta(-event.delta);
      // 同期スクロール開始時のみログ
      if (!isSyncScrollingRef.current) {
        isSyncScrollingRef.current = true;
        logDebug('🔄 ScrollLayer: 同期スクロール開始', { from: event.sourceId });
      }
      // 同期スクロール終了タイマーをリセット
      if (syncScrollEndTimeoutRef.current) {
        clearTimeout(syncScrollEndTimeoutRef.current);
      }
      syncScrollEndTimeoutRef.current = setTimeout(() => {
        isSyncScrollingRef.current = false;
        logDebug('🔄 ScrollLayer: 同期スクロール終了', { from: event.sourceId });
      }, 200);
    });
    return unsubscribe;
  }, [onSync, onWheelDelta, logDebug]);

  // オートスクロール（中央クリック）用のイベント処理
  const handleNativeScroll = useCallback(() => {
    if (!isEnabled || !scrollableContentRef.current) return;

    const currentScrollTop = scrollableContentRef.current.scrollTop;
    const deltaY = currentScrollTop - lastScrollTopRef.current;
    
    if (deltaY !== 0) {
      onWheelDelta(deltaY);
      emitSync(deltaY); // オートスクロールも同期伝搬
      // スクロール開始時のみログ
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        logDebug('↕️ ScrollLayer: ネイティブスクロール開始', { deltaY });
      }
      // スクロール終了タイマーをリセット
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
      scrollEndTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        logDebug('↕️ ScrollLayer: ネイティブスクロール終了');
      }, 200);
    }

    // オートスクロール速度取得用コールバックを呼ぶ
    if (onAutoScroll) {
      onAutoScroll();
    }

    // スクロール位置を常に中央にリセットし、擬似的な無限スクロールを実現
    const scrollHeight = scrollableContentRef.current.scrollHeight;
    const clientHeight = scrollableContentRef.current.clientHeight;
    const newScrollTop = (scrollHeight - clientHeight) / 2;
    scrollableContentRef.current.scrollTop = newScrollTop;
    lastScrollTopRef.current = newScrollTop;

  }, [isEnabled, onWheelDelta, logDebug, emitSync, onAutoScroll]);

  // イベントリスナーの設定とクリーンアップ
  useEffect(() => {
    const layerElement = layerRef.current;
    const scrollableElement = scrollableContentRef.current;

    if (layerElement) {
      // ホイールイベントは外側のレイヤーで捕捉
      layerElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }
    if (scrollableElement) {
      // スクロールイベントは内側のスクロール可能要素で捕捉
      scrollableElement.addEventListener('scroll', handleNativeScroll, { passive: true });

      // 初期スクロール位置を中央に設定
      const scrollHeight = scrollableElement.scrollHeight;
      const clientHeight = scrollableElement.clientHeight;
      const initialScrollTop = (scrollHeight - clientHeight) / 2;
      scrollableElement.scrollTop = initialScrollTop;
      lastScrollTopRef.current = initialScrollTop;
    }

    return () => {
      if (layerElement) {
        layerElement.removeEventListener('wheel', handleWheelEvent);
      }
      if (scrollableElement) {
        scrollableElement.removeEventListener('scroll', handleNativeScroll);
      }
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
      if (syncScrollEndTimeoutRef.current) {
        clearTimeout(syncScrollEndTimeoutRef.current);
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [handleWheelEvent, handleNativeScroll]);

  // Step完了前は非表示
  if (!isEnabled || height === 0) {
    return null;
  }

  // クリックイベントを下層に伝搬させる
  const handleLayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const layer = e.currentTarget;
    // 一時的にpointer-events: none
    const originalPointerEvents = layer.style.pointerEvents;
    layer.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    layer.style.pointerEvents = originalPointerEvents;
    if (el && el !== layer) {
      el.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
      }));
    }
  };

  return (
    <div 
      ref={layerRef}
      className="absolute inset-0 z-10" 
      style={{ pointerEvents: 'auto' }} // ホイールイベントをここで受け取る
      onClick={handleLayerClick}
    >
      {/* 
        オートスクロール（中央クリック）を機能させるための非表示のスクロール領域。
        ホイールイベントはこちらでは処理せず、親divに任せる。
      */}
      <div
        ref={scrollableContentRef}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          // スクロールバーを視覚的に隠す
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE and Edge
        }}
        className="hide-scrollbar" // Webkit用のCSSクラス
      >
        <div style={{ height: '300vh', pointerEvents: 'none' }} />
      </div>
    </div>
  );
});

// App.css または index.css に以下を追加する必要がある
/*
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
*/