// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// デバッグモードの設定
console.log('🎯 Boundary Element Optimization: ENABLED');
console.log('📊 Debug mode controls:');
console.log('  - localStorage.setItem("boundary_debug", "enabled") : 境界要素詳細ログ');
console.log('  - localStorage.setItem("disable_strict_mode", "true") : StrictMode無効化');
console.log('  - localStorage.setItem("debug_mode", "enabled") : 全体デバッグモード');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 境界要素配置のパフォーマンス監視（開発環境のみ）（94版から統合）
if (import.meta.env.DEV) {
  // ページロード完了後に境界要素の状態をチェック
  window.addEventListener('load', () => {
    setTimeout(() => {
      const swiperElements = document.querySelectorAll('[id^="simple-swiper-"]');
      const boundaryElements = document.querySelectorAll('[data-direction]');
      
      console.log('🎯 Boundary Elements Initialization Report:', {
        swiperCount: swiperElements.length,
        boundaryElementCount: boundaryElements.length,
        timestamp: new Date().toISOString()
      });
 
      
      // 境界要素の初期可視性をチェック
      boundaryElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const direction = element.getAttribute('data-direction');
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        console.log(`🔍 Boundary Element ${index + 1}:`, {
          direction,
        
          isVisible,
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          height: Math.round(rect.height)
        });
});
    }, 1000);
  });
  
  // メモリリーク検知（境界要素関連）（94版から統合）
  let boundaryElementCount = 0;
  const originalQuerySelector = document.querySelector;
document.querySelector = function(selector: string) {
    if (selector.includes('data-direction')) {
      boundaryElementCount++;
if (boundaryElementCount > 100) {
        console.warn('⚠️ High boundary element query count detected:', boundaryElementCount);
}
    }
    return originalQuerySelector.call(this, selector);
  };
}
