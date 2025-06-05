// src/components/swiper/useQuadLayerController.ts
// 4つのスワイパー統合制御フック（動的柔軟設計版）

import { useRef, useCallback } from 'react';

// スワイパーの種類定義
type SwiperType = 'infinite-left' | 'scroll-left' | 'infinite-right' | 'scroll-right';

// 同期設定の型定義
interface SyncMapping {
  target: SwiperType;
  direction: 'same' | 'reverse';
}

interface QuadLayerController {
  // ScrollLayer制御
  handleScrollLayerMove: (sourceId: SwiperType, deltaY: number) => void;
  handleImageClick: (sourceId: SwiperType, x: number, y: number) => void;
  
  // SimpleSwiper制御  
  registerSimpleSwiper: (swiperType: SwiperType, element: HTMLElement) => void;
  unregisterSimpleSwiper: (swiperType: SwiperType) => void;
  
  // ScrollLayer制御
  registerScrollLayer: (swiperType: SwiperType, element: HTMLElement) => void;
  unregisterScrollLayer: (swiperType: SwiperType) => void;
  
  // 統計・デバッグ
  getStatus: () => {
    registeredElements: Record<SwiperType, boolean>;
    isSyncing: boolean;
    lastSyncSource: SwiperType | null;
  };
}

export function useQuadLayerController(): QuadLayerController {
  // 要素参照マップ
  const elementsRef = useRef<Map<SwiperType, HTMLElement>>(new Map());
  
  // 同期制御
  const isSyncingRef = useRef(false);
  const lastSyncSourceRef = useRef<SwiperType | null>(null);
  
  // 🔧 同期マッピング設定（動的柔軟設計）
  const syncMappings: Record<SwiperType, SyncMapping[]> = {
    'scroll-left': [
      { target: 'infinite-left', direction: 'same' },    // 順行同期
      { target: 'infinite-right', direction: 'reverse' }  // 逆行同期
    ],
    'scroll-right': [
      { target: 'infinite-right', direction: 'same' },   // 順行同期
      { target: 'infinite-left', direction: 'reverse' }   // 逆行同期
    ],
    'infinite-left': [], // 表示専用（同期なし）
    'infinite-right': [] // 表示専用（同期なし）
  };
  
  // 要素取得ヘルパー
  const getElement = useCallback((swiperType: SwiperType): HTMLElement | null => {
    return elementsRef.current.get(swiperType) || null;
  }, []);
  
  // 🚀 汎用同期処理（柔軟設計）
  const executeSync = useCallback((sourceId: SwiperType, deltaY: number) => {
    const mappings = syncMappings[sourceId];
    if (!mappings || mappings.length === 0) return;
    
    console.log('🔄 QuadLayer sync initiated', {
      source: sourceId,
      deltaY,
      targetCount: mappings.length,
      timestamp: Date.now()
    });
    
    // 各ターゲットに同期実行
    mappings.forEach(({ target, direction }) => {
      const targetElement = getElement(target);
      if (!targetElement) {
        console.warn(`❌ Target element not found: ${target}`);
        return;
      }
      
      // 方向に応じてdeltaYを調整
      const syncDelta = direction === 'same' ? deltaY : -deltaY;
      const currentScrollTop = targetElement.scrollTop;
      const newScrollTop = currentScrollTop + syncDelta;
      
      targetElement.scrollTo({
        top: newScrollTop,
        behavior: 'auto'
      });
      
      console.log(`  ✅ ${sourceId} → ${target} (${direction})`, {
        delta: syncDelta,
        currentScrollTop,
        newScrollTop,
        actualScrollTop: targetElement.scrollTop
      });
    });
  }, [getElement]);
  
  // ScrollLayer → 他のスワイパー への同期
  const handleScrollLayerMove = useCallback((sourceId: SwiperType, deltaY: number) => {
    if (isSyncingRef.current) {
      console.log('🔄 Sync already in progress, skipping', { sourceId, deltaY });
      return; // ループ防止
    }
    
    // スクロール用レイヤーからの操作のみ同期実行
    if (!sourceId.startsWith('scroll-')) {
      console.log('❌ Non-scroll source ignored', { sourceId });
      return;
    }
    
    isSyncingRef.current = true; // 同期開始フラグ
    lastSyncSourceRef.current = sourceId;
    
    console.log('🚀 QuadLayer sync: ScrollLayer → InfiniteSwiper', {
      sourceId,
      deltaY,
      syncMappingCount: syncMappings[sourceId]?.length || 0,
      timestamp: Date.now()
    });
    
    // 同期実行
    executeSync(sourceId, deltaY);
    
    // 同期完了フラグをリセット
    setTimeout(() => {
      isSyncingRef.current = false;
      console.log('✅ QuadLayer sync completed', { sourceId });
    }, 10);
  }, [executeSync]);
  
  // クリック座標処理（拡張版）
  const handleImageClick = useCallback((sourceId: SwiperType, clickX: number, clickY: number) => {
    console.log('🎯 QuadLayer click processing', { 
      sourceId, 
      clickX, 
      clickY 
    });
    
    // スクロール用レイヤーからのクリックを対応する無限スワイパーに転送
    let targetId: SwiperType | null = null;
    
    if (sourceId === 'scroll-left') {
      targetId = 'infinite-left';
    } else if (sourceId === 'scroll-right') {
      targetId = 'infinite-right';
    } else {
      console.log('❌ Non-scroll source click ignored', { sourceId });
      return;
    }
    
    const targetElement = getElement(targetId);
    if (!targetElement) {
      console.log('❌ Target infinite swiper not found', { targetId });
      return;
    }
    
    console.log('📐 QuadLayer click forwarding', {
      sourceId,
      targetId,
      clickX,
      clickY
    });
    
    // ターゲット要素内の座標から画像要素を特定
    const targetRect = targetElement.getBoundingClientRect();
    const relativeX = clickX - targetRect.left;
    const relativeY = clickY - targetRect.top;
    
    // ターゲット領域内の要素を座標から特定
    const elementAtPoint = document.elementFromPoint(
      targetRect.left + relativeX, 
      targetRect.top + relativeY
    );
    
    if (!elementAtPoint) {
      console.log('❌ No element found at coordinates');
      return;
    }
    
    console.log('🔍 Target element found:', elementAtPoint.tagName, elementAtPoint.className);
    
    // 画像要素またはクリック可能な親要素を探索
    let currentElement: Element | null = elementAtPoint;
    for (let i = 0; i < 5; i++) {
      if (!currentElement) break;
      
      if (currentElement.tagName === 'IMG' || 
          currentElement.classList.contains('cursor-pointer') || 
          (currentElement as HTMLElement).onclick) {
        console.log('👆 Clicking target element');
        (currentElement as HTMLElement).click();
        return;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    console.log('❌ No clickable element found');
  }, [getElement]);
  
  // SimpleSwiper要素の登録
  const registerSimpleSwiper = useCallback((swiperType: SwiperType, element: HTMLElement) => {
    elementsRef.current.set(swiperType, element);
    console.log('✅ SimpleSwiper registered in QuadLayerController', { 
      swiperType,
      totalRegistered: elementsRef.current.size
    });
  }, []);
  
  const unregisterSimpleSwiper = useCallback((swiperType: SwiperType) => {
    const removed = elementsRef.current.delete(swiperType);
    if (removed) {
      console.log('❌ SimpleSwiper unregistered from QuadLayerController', { 
        swiperType,
        remainingCount: elementsRef.current.size
      });
    }
  }, []);
  
  // ScrollLayer要素の登録
  const registerScrollLayer = useCallback((swiperType: SwiperType, element: HTMLElement) => {
    elementsRef.current.set(swiperType, element);
    console.log('✅ ScrollLayer registered in QuadLayerController', { 
      swiperType,
      totalRegistered: elementsRef.current.size
    });
  }, []);
  
  const unregisterScrollLayer = useCallback((swiperType: SwiperType) => {
    const removed = elementsRef.current.delete(swiperType);
    if (removed) {
      console.log('❌ ScrollLayer unregistered from QuadLayerController', { 
        swiperType,
        remainingCount: elementsRef.current.size
      });
    }
  }, []);
  
  // ステータス取得（デバッグ用）
  const getStatus = useCallback(() => {
    const registeredElements: Record<SwiperType, boolean> = {
      'infinite-left': elementsRef.current.has('infinite-left'),
      'scroll-left': elementsRef.current.has('scroll-left'),
      'infinite-right': elementsRef.current.has('infinite-right'),
      'scroll-right': elementsRef.current.has('scroll-right')
    };
    
    return {
      registeredElements,
      isSyncing: isSyncingRef.current,
      lastSyncSource: lastSyncSourceRef.current
    };
  }, []);

  return {
    handleScrollLayerMove,
    handleImageClick,
    registerSimpleSwiper,
    unregisterSimpleSwiper,
    registerScrollLayer,
    unregisterScrollLayer,
    getStatus
  };
}