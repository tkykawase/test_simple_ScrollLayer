// src/hooks/useDualLayerController.ts
// 二重レイヤー方式の統合制御フック

import { useRef, useCallback } from 'react';

interface DualLayerController {
  // ScrollLayer制御
  handleScrollLayerMove: (deltaY: number) => void;
  handleImageClick: (x: number, y: number) => void;
  
  // SimpleSwiper制御  
  registerSimpleSwiper: (element: HTMLElement) => void;
  unregisterSimpleSwiper: (element: HTMLElement) => void;
  
  // ScrollLayer制御
  registerScrollLayer: (element: HTMLElement) => void;
  unregisterScrollLayer: (element: HTMLElement) => void;
  
  // 統計・デバッグ
  getStatus: () => {
    isScrollLayerRegistered: boolean;
    isSimplerSwiperRegistered: boolean;
    isSyncing: boolean;
  };
}

export function useDualLayerController(): DualLayerController {
  // 要素参照
  const scrollLayerRef = useRef<HTMLElement | null>(null);
  const simpleSwiperRef = useRef<HTMLElement | null>(null);
  
  // 同期制御
  const isSyncingRef = useRef(false);
  
  // ScrollLayer → SimpleSwiper への同期
  const handleScrollLayerMove = useCallback((deltaY: number) => {
    if (isSyncingRef.current) return; // ループ防止
    
    // SimpleSwiperの要素を取得
    const displayContainer = document.getElementById('simple-swiper-left');
    if (!displayContainer) {
      console.warn('❌ SimpleSwiper not found for sync');
      return;
    }

    isSyncingRef.current = true; // 同期開始フラグ
    
    const currentScrollTop = displayContainer.scrollTop;
    const newScrollTop = currentScrollTop + deltaY; // 同方向に移動

    displayContainer.scrollTo({
      top: newScrollTop,
      behavior: 'auto'
    });

    console.log('🔄 DualLayer sync: ScrollLayer → SimpleSwiper', {
      deltaY,
      currentScrollTop,
      newScrollTop,
      timestamp: Date.now()
    });
    
    // 同期完了フラグをリセット
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 10);
  }, []);
  
  // クリック座標処理
  const handleImageClick = useCallback((clickX: number, clickY: number) => {
    // SimpleSwiperの要素を取得
    const displayContainer = document.getElementById('simple-swiper-left');
    if (!displayContainer) {
      console.log('❌ SimpleSwiper not found for click processing');
      return;
    }

    console.log('🎯 DualLayer click processing', { clickX, clickY });

    // 左レイヤーの座標を右レイヤーの座標に変換
    const leftPanel = displayContainer.parentElement;
    const rightPanel = document.querySelector('.w-1\\/2:last-child');
    
    if (!leftPanel || !rightPanel) {
      console.log('❌ Panel elements not found');
      return;
    }

    const leftRect = leftPanel.getBoundingClientRect();
    const rightRect = rightPanel.getBoundingClientRect();
    
    // 相対座標を計算（右パネル基準 → 左パネル基準）
    const relativeX = clickX - rightRect.left;
    const relativeY = clickY - rightRect.top;
    
    console.log('📐 DualLayer coordinate conversion:', {
      leftRect: { x: leftRect.left, y: leftRect.top },
      rightRect: { x: rightRect.left, y: rightRect.top },
      relativeX,
      relativeY
    });

    // 左パネル内の要素を座標から特定
    const targetElement = document.elementFromPoint(leftRect.left + relativeX, leftRect.top + relativeY);
    
    if (!targetElement) {
      console.log('❌ No element found at coordinates');
      return;
    }

    console.log('🔍 Target element found:', targetElement.tagName, targetElement.className);

    // 画像要素またはその親要素を探索
    let imageElement: Element | null = targetElement;
    let clickableParent = null;
    
    // 最大5階層まで親要素を遡って画像関連要素を探す
    for (let i = 0; i < 5; i++) {
      if (!imageElement) break;
      
      if (imageElement.tagName === 'IMG') {
        // img要素を発見
        const imageUrl = (imageElement as HTMLImageElement).src;
        console.log('🖼️ Image found:', imageUrl);
        
        // TODO: プロジェクトナビゲーション処理
        // navigate(`/project/${project.id}`);
        console.log('🚀 Navigate to project (TODO)');
        return;
      }
      
      // クリック可能な親要素をチェック
      if (imageElement.classList.contains('cursor-pointer') || 
          (imageElement as HTMLElement).onclick || 
          imageElement.getAttribute('data-project-id')) {
        clickableParent = imageElement;
      }
      
      const parent: Element | null = imageElement.parentElement;
      imageElement = parent;
    }
    
    // 画像が見つからない場合、クリック可能な親要素をクリック
    if (clickableParent) {
      console.log('👆 Clicking parent element');
      (clickableParent as HTMLElement).click();
      return;
    }
    
    console.log('❌ No matching element found for click');
  }, []);
  
  // SimpleSwiper要素の登録
  const registerSimpleSwiper = useCallback((element: HTMLElement) => {
    simpleSwiperRef.current = element;
    console.log('✅ SimpleSwiper registered in DualLayerController');
  }, []);
  
  const unregisterSimpleSwiper = useCallback((element: HTMLElement) => {
    if (simpleSwiperRef.current === element) {
      simpleSwiperRef.current = null;
      console.log('❌ SimpleSwiper unregistered from DualLayerController');
    }
  }, []);
  
  // ScrollLayer要素の登録
  const registerScrollLayer = useCallback((element: HTMLElement) => {
    scrollLayerRef.current = element;
    console.log('✅ ScrollLayer registered in DualLayerController');
  }, []);
  
  const unregisterScrollLayer = useCallback((element: HTMLElement) => {
    if (scrollLayerRef.current === element) {
      scrollLayerRef.current = null;
      console.log('❌ ScrollLayer unregistered from DualLayerController');
    }
  }, []);
  
  // ステータス取得
  const getStatus = useCallback(() => ({
    isScrollLayerRegistered: !!scrollLayerRef.current,
    isSimplerSwiperRegistered: !!simpleSwiperRef.current,
    isSyncing: isSyncingRef.current
  }), []);

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