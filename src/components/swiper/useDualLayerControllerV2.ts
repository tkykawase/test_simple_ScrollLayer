// src/components/swiper/useDualLayerControllerV2.ts
// 重ね合わせ専用の簡素化コントローラー（pointer-events対応版）

import { useRef, useCallback } from 'react';

// スワイパーの種類定義（重ね合わせ版）
type SwiperType = 'infinite-left' | 'scroll-left' | 'infinite-right' | 'scroll-right';

// 同期設定の型定義
interface SyncMapping {
  target: SwiperType;
  direction: 'same' | 'reverse';
}

interface DualLayerControllerV2 {
  // ScrollLayer制御（簡素化版）
  handleScrollLayerMove: (sourceId: SwiperType, deltaY: number) => void;
  
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

export function useDualLayerControllerV2(): DualLayerControllerV2 {
  // 要素参照マップ
  const elementsRef = useRef<Map<SwiperType, HTMLElement>>(new Map());
  
  // 同期制御
  const isSyncingRef = useRef(false);
  const lastSyncSourceRef = useRef<SwiperType | null>(null);
  
  // 🔧 同期マッピング設定（重ね合わせ専用・簡素化版）
  const syncMappings: Record<SwiperType, SyncMapping[]> = {
    'scroll-left': [
      { target: 'infinite-left', direction: 'same' },    // 順行同期
      { target: 'infinite-right', direction: 'reverse' }  // 逆行同期
    ],
    'scroll-right': [
      { target: 'infinite-right', direction: 'same' },   // 順行同期
      { target: 'infinite-left', direction: 'reverse' }   // 逆行同期
    ],
    'infinite-left': [],   // 表示専用（同期なし）
    'infinite-right': []   // 表示専用（同期なし）
  };
  
  // 要素取得ヘルパー
  const getElement = useCallback((swiperType: SwiperType): HTMLElement | null => {
    return elementsRef.current.get(swiperType) || null;
  }, []);
  
  // 🚀 汎用同期処理（重ね合わせ対応版）
  const executeSync = useCallback((sourceId: SwiperType, deltaY: number) => {
    const mappings = syncMappings[sourceId];
    if (!mappings || mappings.length === 0) return;
    
    console.log('🔄 DualLayerV2 sync initiated', {
      source: sourceId,
      deltaY,
      targetCount: mappings.length,
      overlayMode: true,
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
  
  // ScrollLayer → 他のスワイパー への同期（簡素化版）
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
    
    console.log('🚀 DualLayerV2 sync: ScrollLayer → InfiniteSwiper (Overlay Mode)', {
      sourceId,
      deltaY,
      syncMappingCount: syncMappings[sourceId]?.length || 0,
      clickThrough: true,
      timestamp: Date.now()
    });
    
    // 同期実行
    executeSync(sourceId, deltaY);
    
    // 同期完了フラグをリセット
    setTimeout(() => {
      isSyncingRef.current = false;
      console.log('✅ DualLayerV2 sync completed', { sourceId });
    }, 10);
  }, [executeSync]);
  
  // SimpleSwiper要素の登録
  const registerSimpleSwiper = useCallback((swiperType: SwiperType, element: HTMLElement) => {
    elementsRef.current.set(swiperType, element);
    console.log('✅ SimpleSwiper registered in DualLayerControllerV2', { 
      swiperType,
      totalRegistered: elementsRef.current.size,
      overlayMode: true
    });
  }, []);
  
  const unregisterSimpleSwiper = useCallback((swiperType: SwiperType) => {
    const removed = elementsRef.current.delete(swiperType);
    if (removed) {
      console.log('❌ SimpleSwiper unregistered from DualLayerControllerV2', { 
        swiperType,
        remainingCount: elementsRef.current.size
      });
    }
  }, []);
  
  // ScrollLayer要素の登録
  const registerScrollLayer = useCallback((swiperType: SwiperType, element: HTMLElement) => {
    elementsRef.current.set(swiperType, element);
    console.log('✅ ScrollLayer registered in DualLayerControllerV2', { 
      swiperType,
      totalRegistered: elementsRef.current.size,
      pointerEventsMode: 'click-through'
    });
  }, []);
  
  const unregisterScrollLayer = useCallback((swiperType: SwiperType) => {
    const removed = elementsRef.current.delete(swiperType);
    if (removed) {
      console.log('❌ ScrollLayer unregistered from DualLayerControllerV2', { 
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
    registerSimpleSwiper,
    unregisterSimpleSwiper,
    registerScrollLayer,
    unregisterScrollLayer,
    getStatus
  };
}