// src/components/swiper/useInfiniteScroll.ts
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { SwipeItem, InfiniteScrollConfig } from '../../types';

export const useInfiniteScroll = (config: InfiniteScrollConfig) => {
  const { items } = config;
  // 共通設定（combined_code_94の改良版を統合）
  const commonConfig = useMemo(() => ({
    maxRenderedItems: 15,     // 画面2.5画面分（軽量だが十分）
    bufferSize: 8,           // 1画面分ずつ追加
    rootMargin: '200px',     // 94版: 600px → 200px に最適化
    timeout: 16,             // 適度な高速処理
    preloadMultiplier: 3     // 初期は3倍読み込み
  }), []);
  const {
    maxRenderedItems,
    bufferSize,
    rootMargin,
    timeout,
    preloadMultiplier
  } = commonConfig;
  const [visibleItems, setVisibleItems] = useState<SwipeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);
  
  // 🔥 追加: グローバルカウンターでID重複を完全防止
  const globalCounterRef = useRef(0);
  // isLoadingRefを同期
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  // 画像配列を循環させて必要な分だけ生成（グローバルカウンター版）
  const generateCircularItems = useCallback((count: number): SwipeItem[] => {
    if (items.length === 0) return [];
    
    const result: SwipeItem[] = [];
    for (let i = 0; i < count; i++) {
      const sourceIndex = globalCounterRef.current % items.length;
      const item = items[sourceIndex];
      // グローバルカウンターで完全一意なIDを生成
      const uniqueId = `item-${sourceIndex}-global${globalCounterRef.current}`;
      
      result.push({
        
...item,
        id: uniqueId
      });
      
      // カウンターを増加
      globalCounterRef.current++;
    }
    return result;
  }, [items]);
  // 境界要素が画面内に配置されるかを確認する関数（94版から統合）
  const ensureBoundaryElementsVisible = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerHeight = container.scrollHeight;
    const viewportHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    
    // 画面内の範囲を計算（rootMargin考慮）
    const rootMarginPx = parseInt(rootMargin) || 200;
    const visibleTop = scrollTop - rootMarginPx;
    const visibleBottom = scrollTop + viewportHeight + rootMarginPx;
    
    // 境界要素が画面外の場合の調整
    if (visibleTop < 
0 || visibleBottom > containerHeight) {
      // より安全な中央位置を計算（94版の改良アルゴリズム）
      const safeCenter = Math.max(
        rootMarginPx * 1.5, // 上端から十分な余裕
        Math.min(
          containerHeight - viewportHeight - rootMarginPx * 1.5, // 下端から十分な余裕
          (containerHeight - viewportHeight) / 2 // 理想的な中央
        )
      );
      
     
  container.scrollTo({
        top: safeCenter,
        behavior: 'auto'
      });
}
  }, [rootMargin]);

  // 初期データの設定（94版の安全な初期位置設定を統合）
  useEffect(() => {
    if (items.length > 0) {
      const preloadCount = Math.min(
        maxRenderedItems + bufferSize, 
        items.length * preloadMultiplier
      );
      setVisibleItems(generateCircularItems(preloadCount));
      
      // 境界要素の可視性を保証する初期配置（94版から統合）
      setTimeout(() => {
        if (containerRef.current) {
          
          const containerHeight = containerRef.current.scrollHeight;
          const viewportHeight = containerRef.current.clientHeight;
          const rootMarginPx = parseInt(rootMargin) || 200;
          
          // 境界要素が確実に検知される位置を計算
          const safeCenter = Math.max(
            rootMarginPx * 1.5, // 上端境界要素が検知される位置
            Math.min(
       
              containerHeight - viewportHeight - rootMarginPx * 1.5, // 下端境界要素が検知される位置
              (containerHeight - viewportHeight) / 2 // 理想的な中央
            )
          );
          
          containerRef.current.scrollTo({
            top: safeCenter,
          
            behavior: 'auto'
          });
          // 初期配置後に境界要素の可視性を確認
          setTimeout(() => {
            ensureBoundaryElementsVisible();
          }, 100);
}
      }, 150); // 94版: 100ms → 150ms に調整
    }
  }, [items, maxRenderedItems, bufferSize, preloadMultiplier, generateCircularItems, rootMargin, ensureBoundaryElementsVisible]);
  // 新しいアイテムを追加（94版の保守的削除アルゴリズムを統合）
  const loadMoreItems = useCallback((direction: 'append' | 'prepend' = 'append') => {
    if (isLoadingRef.current || items.length === 0) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(() => {
      setVisibleItems(prev => {
        const newItems = generateCircularItems(bufferSize);
        let combined: SwipeItem[];
    
        
        if (direction === 'prepend') {
          // 上方向に追加
          combined = [...newItems, ...prev];
        } else {
          // 下方向に追加（既存）
          combined = [...prev, ...newItems];
        }
        
        // 94版の保守的削除アルゴリズムを統合
 
        const safeLimit = maxRenderedItems * 2.5; // 94版: 1.4 → 2.5 に大幅緩和
        
        if (combined.length > safeLimit) {
          // 境界要素を確実に画面内に保持する削除数計算
          const safeTargetCount = Math.max(
            maxRenderedItems + 8, // 十分な余裕を確保
            combined.length - Math.floor(bufferSize / 3) // 削除を最小限に
    
          );
          
          if (direction === 'prepend') {
            // 上方向追加時は下から最小限削除
            return combined.slice(0, safeTargetCount);
} else {
            // 下方向追加時は上から最小限削除
            return combined.slice(-safeTargetCount);
}
        }
        
        return combined;
});
      
      // 境界要素の可視性を確認（94版から統合）
      setTimeout(() => {
        ensureBoundaryElementsVisible();
        
        isLoadingRef.current = false;
        setIsLoading(false);
      }, 50);
}, timeout);
  }, [items.length, bufferSize, maxRenderedItems, generateCircularItems, timeout, ensureBoundaryElementsVisible]);

  // IntersectionObserver のセットアップ（94版設定を統合 + 複数要素対応）
  useEffect(() => {
    const setupObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isLoadingRef.current) {
     
              const direction = entry.target.getAttribute('data-direction') as 'append' | 'prepend';
              
              // デバッグログ（簡潔版）
              console.log('🎯 Boundary triggered:', {
                direction: direction || 'append',
                elementTop: Math.round(entry.boundingClientRect.top),
  
                intersectionRatio: Math.round(entry.intersectionRatio * 100) / 100
              });
              
              loadMoreItems(direction || 'append');
            }
          });
        },
       
        {
          root: null,           // 94版: ビューポート基準
          rootMargin: rootMargin, // 94版: 200px
          threshold: 0.1
        }
      );
};

    setupObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
}
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
}
    };
  }, [loadMoreItems, rootMargin]);

  // 境界要素の監視を開始（94版の複数要素同時監視方式を統合）
  const observeElement = useCallback((element: HTMLElement | null, direction: 'append' | 'prepend' = 'append') => {
    if (!observerRef.current || !element) return;
    
    // 方向をdata属性として設定
    element.setAttribute('data-direction', direction);
    
    // 要素の位置情報を取得（94版の可視性チェック）
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    // 要素が画面外すぎる場合の警告
    if (!isVisible && Math.abs(rect.top) > window.innerHeight * 2) {
   
      // 境界要素の再配置を試行
      ensureBoundaryElementsVisible();
    }
    
    // 🔥 修正: disconnect()を削除して複数要素の同時監視を可能に
    // 新しい要素を追加監視（既存の監視は維持）
    try {
      observerRef.current.observe(element);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to observe element:', {
        error: errorMessage,
        direction,
        elementId: 
element.id
      });
    }
  }, [ensureBoundaryElementsVisible]);
  return {
    visibleItems,
    isLoading,
    containerRef,
    observeElement
  };
};
