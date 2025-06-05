// src/components/swiper/ScrollLayer.tsx
// 透明操作レイヤー（QuadLayerController対応・慣性なし版）

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface ScrollLayerProps {
  onScroll: (deltaY: number) => void; // 移動量を親に通知
  onImageClick: (x: number, y: number) => void; // 画像クリック座標を通知
  controller?: {
    registerScrollLayer: (element: HTMLElement) => void;
    unregisterScrollLayer: () => void;
  }; // QuadLayerController（オプション）
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export const ScrollLayer = React.memo(function ScrollLayer({
  onScroll,
  onImageClick,
  controller
}: ScrollLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  
  // 高精度タッチ判定用の状態
  const [touchHistory, setTouchHistory] = useState<TouchPoint[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartRef = useRef<TouchPoint | null>(null);

  // 🔥 高速スクロール対応（慣性なし）
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wheelVelocityRef = useRef(0);
  const isWheelScrollingRef = useRef(false);

  // QuadLayerControllerへの登録
  useEffect(() => {
    if (controller && containerRef.current) {
      controller.registerScrollLayer(containerRef.current);
      console.log('✅ ScrollLayer registered to QuadLayerController');
      
      return () => {
        controller.unregisterScrollLayer();
        console.log('❌ ScrollLayer unregistered from QuadLayerController');
      };
    }
  }, [controller]);

  // 速度計算関数
  const calculateVelocity = useCallback((points: TouchPoint[]): number => {
    if (points.length < 2) return 0;
    
    const recent = points.slice(-3); // 最新3点で計算
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const distance = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );
    const timeDiff = last.time - first.time;
    
    return timeDiff > 0 ? (distance / timeDiff) * 1000 : 0; // px/s
  }, []);

  // スクロールイベントハンドラー（移動量計算）
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const currentScrollTop = target.scrollTop;
    const deltaY = currentScrollTop - lastScrollTopRef.current;
    
    // 移動量を親に通知（QuadLayerController経由で同期）
    if (deltaY !== 0) {
      onScroll(deltaY);
      console.log('📜 ScrollLayer scroll event', {
        deltaY,
        currentScrollTop,
        timestamp: Date.now()
      });
    }
    
    lastScrollTopRef.current = currentScrollTop;
  }, [onScroll]);

  // 🔥 高速スクロール処理（慣性なし版）
  const handleHighSpeedScroll = useCallback(() => {
    if (!containerRef.current || !isWheelScrollingRef.current) return;

    const container = containerRef.current;
    const currentScrollTop = container.scrollTop;
    const scrollAmount = wheelVelocityRef.current;
    const newScrollTop = currentScrollTop + scrollAmount;
    
    // スクロール実行
    container.scrollTop = newScrollTop;
    lastScrollTopRef.current = newScrollTop;
    
    // 同期処理（QuadLayerController経由）
    if (scrollAmount !== 0) {
      onScroll(scrollAmount);
    }
    
    // 🔥 慣性なし：即座停止
    isWheelScrollingRef.current = false;
    wheelVelocityRef.current = 0;
    console.log('🛑 High-speed scroll stopped (no inertia)');
    return;
  }, [onScroll]);

  // 🔥 ホイールイベント強化版（慣性なし）
  const handleWheelEvent = useCallback((e: React.WheelEvent) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const deltaY = e.deltaY;
    
    // 🔥 高速スクロール検知
    const isHighSpeed = Math.abs(deltaY) > 150; // 150px以上で高速判定
    
    if (isHighSpeed) {
      console.log('🚀 ScrollLayer high-speed scroll detected:', { 
        deltaY, 
        velocity: deltaY,
        timestamp: Date.now()
      });
      
      // 高速スクロールモード開始（慣性なし）
      wheelVelocityRef.current = deltaY * 0.8; // 初期速度設定
      
      if (!isWheelScrollingRef.current) {
        isWheelScrollingRef.current = true;
        requestAnimationFrame(handleHighSpeedScroll);
      }
    } else {
      // 通常スクロール処理
      const currentScrollTop = container.scrollTop;
      const newScrollTop = currentScrollTop + deltaY;
      
      container.scrollTop = newScrollTop;
      lastScrollTopRef.current = newScrollTop;
      
      if (deltaY !== 0) {
        onScroll(deltaY);
      }
      
      console.log('🎡 ScrollLayer normal scroll:', {
        wheelDeltaY: deltaY,
        newScrollTop: newScrollTop,
        actualScrollTop: container.scrollTop,
        timestamp: Date.now()
      });
    }
    
    // 連続ホイール検知タイマー
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
    }
    
    wheelTimeoutRef.current = setTimeout(() => {
      // 一定時間後に高速モード終了
      if (isWheelScrollingRef.current) {
        isWheelScrollingRef.current = false;
        wheelVelocityRef.current = 0;
        console.log('⏱️ ScrollLayer wheel timeout - high-speed mode ended');
      }
    }, 150);
    
    e.stopPropagation();
  }, [onScroll, handleHighSpeedScroll]);

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // マルチタッチ無視
    
    const touch = e.touches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    touchStartRef.current = touchPoint;
    setTouchHistory([touchPoint]);
    setIsScrolling(false);
    
    console.log('🟢 ScrollLayer touch start:', touchPoint);
  }, []);

  // タッチ移動（速度ベース判定）
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    setTouchHistory(prev => {
      const newHistory = [...prev, touchPoint];
      
      // 履歴は最新5点まで保持
      const trimmedHistory = newHistory.slice(-5);
      
      // 速度計算
      const velocity = calculateVelocity(trimmedHistory);
      
      // 高精度判定: 30px/s以上でスクロール意図と判定
      if (velocity > 30) {
        setIsScrolling(true);
        console.log('🔄 ScrollLayer scroll detected:', { 
          velocity: velocity.toFixed(1),
          timestamp: Date.now()
        });
      }
      
      return trimmedHistory;
    });
  }, [calculateVelocity]);

  // タッチ終了（最終判定）
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touchEnd = e.changedTouches[0];
    const endPoint: TouchPoint = {
      x: touchEnd.clientX,
      y: touchEnd.clientY,
      time: Date.now()
    };
    
    // 最終速度計算
    const finalVelocity = calculateVelocity([...touchHistory, endPoint]);
    const totalTime = endPoint.time - touchStartRef.current.time;
    const totalDistance = Math.sqrt(
      Math.pow(endPoint.x - touchStartRef.current.x, 2) + 
      Math.pow(endPoint.y - touchStartRef.current.y, 2)
    );
    
    console.log('🔍 ScrollLayer touch analysis:', {
      velocity: finalVelocity.toFixed(1),
      distance: totalDistance.toFixed(1),
      time: totalTime,
      isScrolling,
      timestamp: Date.now()
    });
    
    // 高精度クリック判定
    const isClick = !isScrolling && finalVelocity < 50 && totalDistance < 10 && totalTime < 300;
    
    if (isClick) {
      console.log('🎯 ScrollLayer click detected!');
      onImageClick(touchEnd.clientX, touchEnd.clientY);
    } else {
      console.log('📜 ScrollLayer scroll action confirmed');
    }
    
    // リセット
    touchStartRef.current = null;
    setTouchHistory([]);
    setIsScrolling(false);
  }, [touchHistory, isScrolling, calculateVelocity, onImageClick]);

  // マウスクリックハンドラー（デスクトップ用）
  const handleMouseClick = useCallback((e: React.MouseEvent) => {
    console.log('🖱️ ScrollLayer mouse click detected');
    onImageClick(e.clientX, e.clientY);
  }, [onImageClick]);

  // 初期スクロール位置を中央に設定
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const centerPosition = container.scrollHeight / 2;
      
      container.scrollTo({
        top: centerPosition,
        behavior: 'auto'
      });
      
      lastScrollTopRef.current = centerPosition;
      
      console.log('🎯 ScrollLayer initialized for QuadController', {
        scrollHeight: container.scrollHeight,
        centerPosition,
        initialScrollTop: container.scrollTop,
        timestamp: Date.now()
      });
    }
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      isWheelScrollingRef.current = false;
      wheelVelocityRef.current = 0;
      console.log('🧹 ScrollLayer cleanup completed');
    };
  }, []);

  return (
    <div className="relative h-full bg-green-100"> {/* 🔍 背景色を変更してデバッグ */}
      {/* 操作説明 */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded shadow text-sm">
        <p className="font-medium">操作レイヤー（QuadController）</p>
        <p className="text-gray-600">タッチ/クリック操作</p>
        <div className="text-xs text-gray-500 mt-1">
          <p>速度判定: {isScrolling ? '📜 スクロール中' : '👆 タッチ待機'}</p>
          <p>🔍 高速スクロール対応（慣性なし）</p>
          <p>🔄 QuadLayer統合制御</p>
        </div>
      </div>
      
      {/* 透明スクロールエリア */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto border-2 border-green-500" // 🔍 境界を可視化
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleMouseClick}
        onWheelCapture={handleWheelEvent} // 🔥 強化版ホイールハンドラー（慣性なし）
        style={{
          // 巨大な仮想高さで無限スクロール感を演出
          '--scroll-content-height': '999999px',
        } as React.CSSProperties}
      >
        {/* 巨大な透明コンテンツ */}
        <div 
          className="w-full bg-orange-50" // 🔍 背景色追加
          style={{ height: '999999px' }}
        >
          {/* 可視化用のガイドライン（デバッグ用） */}
          <div className="relative">
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="h-40 border-b-4 border-green-500 flex items-center justify-center text-green-700 font-bold text-2xl"
                >
                🎮 {i * 160}px
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* スクロール位置表示（デバッグ用） */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-2 rounded text-xs">
        <p>ScrollLayer QuadController</p>
        <p>Scroll: {lastScrollTopRef.current.toFixed(0)}px</p>
        <p>Velocity: {touchHistory.length > 1 ? calculateVelocity(touchHistory).toFixed(1) : '0'}px/s</p>
        <p>Status: {isScrolling ? 'Scrolling' : 'Ready'}</p>
        <p>Wheel: {isWheelScrollingRef.current ? 'Fast (No Inertia)' : 'Normal'}</p>
        <p>Controller: {controller ? 'Connected' : 'Standalone'}</p>
      </div>
    </div>
  );
});