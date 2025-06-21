import { useRef, useCallback } from 'react';

interface OneLayerController {
  contentRef: React.RefObject<HTMLDivElement>;
  handleScrollLayerMove: (deltaY: number) => void;
  scrollToCenter: () => void;
}

export const useOneLayerController = (): OneLayerController => {
  const contentRef = useRef<HTMLDivElement>(null);

  // ScrollLayerからの移動量を受け取ってコンテンツレイヤーを制御
  const handleScrollLayerMove = useCallback((deltaY: number) => {
    if (!contentRef.current) return;

    const contentContainer = contentRef.current;
    const currentScrollTop = contentContainer.scrollTop;
    const newScrollTop = currentScrollTop + deltaY;
    
    // スムーズにスクロール
    contentContainer.scrollTo({
      top: newScrollTop,
      behavior: 'auto' // 即座に移動
    });

    // スクロール同期ログは削除（頻度が高すぎるため）
  }, []);

  const scrollToCenter = useCallback(() => {
    if (!contentRef.current) return;

    const contentContainer = contentRef.current;
    const centerPosition = contentContainer.scrollHeight / 2;
    
    contentContainer.scrollTo({
      top: centerPosition,
      behavior: 'auto'
    });
  }, []);

  return {
    contentRef,
    handleScrollLayerMove,
    scrollToCenter
  };
};