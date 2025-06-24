import { useRef, useCallback, useEffect } from 'react';

const DAMPING_FACTOR = 0.92; // 減衰係数。1に近いほど摩擦が少ない

/**
 * 慣性スクロールを管理するカスタムフック
 * @param isEnabled - フックが有効かどうか
 * @param onScroll - スクロール位置が更新されるたびに呼び出されるコールバック
 */
export const useInertiaController = (
  isEnabled: boolean,
  onScroll?: (scrollTop: number) => void
) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const animationLoop = useCallback(() => {
    if (!contentRef.current) return;

    const container = contentRef.current;
    
    // 速度を適用してスクロール
    container.scrollTop += velocityRef.current;
    
    // スクロール位置の更新を通知
    if (onScroll) {
      onScroll(container.scrollTop);
    }
    
    // 速度を減衰させる
    velocityRef.current *= DAMPING_FACTOR;
    
    // 速度がほぼゼロになったらアニメーションを停止
    if (Math.abs(velocityRef.current) < 0.1) {
      velocityRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    }
  }, [onScroll]);

  /**
   * スクロールに力を加える
   * @param force - 加える力の量（例: `e.deltaY`）
   */
  const addForce = useCallback((force: number) => {
    velocityRef.current += force * 0.4; // 入力量を調整
    
    // アニメーションループが実行されていなければ開始
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    }
  }, [animationLoop]);
  
  /**
   * コンテンツを中央にスクロールする
   */
  const scrollToCenter = useCallback(() => {
    if (!contentRef.current) return;
    // 進行中の慣性を停止
    velocityRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const container = contentRef.current;
    const centerPosition = container.scrollHeight / 2;
    container.scrollTo({
      top: centerPosition,
      behavior: 'auto'
    });
  }, []);

  // フックが無効になった場合やアンマウント時にクリーンアップ
  useEffect(() => {
    if (!isEnabled) {
      velocityRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEnabled]);

  return {
    contentRef,
    addForce,
    scrollToCenter
  };
}; 