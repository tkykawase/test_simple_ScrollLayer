// src/components/swiper/SimpleSwiper.tsx
// 外部コントローラー対応版

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/lib/image-utils';
import { useInfiniteScroll } from './useInfiniteScroll';
import type { InfiniteScrollConfig, Project, ProjectImage } from '../../types';

interface SwiperController {
  registerSimpleSwiper: (element: HTMLDivElement) => void;
  unregisterSimpleSwiper: (element: HTMLDivElement) => void;
}

interface SimpleSwiperProps {
  images: string[];                    // 表示する画像URLの配列
  projects: Project[];                 // プロジェクト情報
  side: 'left' | 'right';             // 左右どちらのスワイパーか
  controller?: SwiperController;       // 外部コントローラー（オプション）
}

export const SimpleSwiper = React.memo(function SimpleSwiper({
  images,
  projects,
  side,
  controller
}: SimpleSwiperProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // 外部コントローラーへの登録
  useEffect(() => {
    if (controller && containerRef.current) {
      controller.registerSimpleSwiper(containerRef.current);
      console.log('✅ SimpleSwiper registered to controller');
      
      return () => {
        if (containerRef.current) {
          controller.unregisterSimpleSwiper(containerRef.current);
          console.log('❌ SimpleSwiper unregistered from controller');
        }
      };
    }
  }, [controller]);

  // 無限スクロール設定（94版の最適化済み設定を統合）
  const infiniteScrollConfig: InfiniteScrollConfig = useMemo(() => ({
    items: (images || []).map((url, index) => ({
      id: `item-${index}`,
      imageUrl: url,
      title: `Image ${index + 1}`
    })),
    maxRenderedItems: 15,    // 94版の最適値
    bufferSize: 8,          // 94版の最適値
    rootMargin: '200px',    // 94版の最適化済み値
    timeout: 16,
    preloadMultiplier: 3,
    threshold: 0.1,
    enabled: true,
    bidirectional: true     // 双方向無限スクロール
  }), [images]);

  // 無限スクロール機能の初期化（統合版フック使用）
  const {
    visibleItems,
    isLoading,
    containerRef: infiniteContainerRef,
    observeElement
  } = useInfiniteScroll(infiniteScrollConfig);

  // containerRefを統合
  useEffect(() => {
    if (containerRef.current && infiniteContainerRef) {
      (infiniteContainerRef as React.MutableRefObject<HTMLDivElement>).current = containerRef.current;
    }
  }, [infiniteContainerRef]);

  // 画像クリック時のナビゲーション（94版から統合）
  const handleImageClick = useCallback((imageUrl: string) => {
    const project = projects.find(p => 
      p.project_images?.some((img: ProjectImage) => img.image_url === imageUrl)
    );
    
    if (project) {
      navigate(`/project/${project.id}`);
    }
  }, [projects, navigate]);

  // 表示用の画像データを準備（94版の改良ロジックを統合）
  const imageElements = useMemo(() => {
    // 無限スクロールが有効な場合は visibleItems を使用
    // そうでなければ既存の images を使用
    const displayItems = visibleItems.length > 0 
      ? visibleItems 
      : (images || []).map((url, index) => ({ 
          id: `fallback-${index}`, 
          imageUrl: url, 
          title: `Image ${index + 1}` 
        }));

    return displayItems.map((item, index) => {
      const project = projects.find(p => 
        p.project_images?.some((img: ProjectImage) => img.image_url === item.imageUrl)
      );

      if (!project) return null;

      const isFirstItem = index === 0;
      const isLastItem = index === displayItems.length - 1;

      return (
        <div
          key={item.id}
          ref={(el) => {
            if (el) { // 94版の安全なnullチェック
              if (isFirstItem && infiniteScrollConfig.bidirectional) {
                // 最初の要素を上方向監視（94版の境界要素配置最適化済み）
                observeElement(el, 'prepend');
              } else if (isLastItem) {
                // 最後の要素を下方向監視（94版の境界要素配置最適化済み）
                observeElement(el, 'append');
              }
            }
          }}
          className="relative cursor-pointer"
          onClick={() => handleImageClick(item.imageUrl)}
        >
          <img
            src={getImageUrl(item.imageUrl, { width: 800, quality: 80 })}
            alt={project.title || 'Project Image'}
            className="w-full block select-none"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              console.error('Image failed to load:', { url: item.imageUrl });
              e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
            }}
          />
          
          {/* ホバー時の情報オーバーレイ（94版から統合） */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <div className="text-white">
                <h3 className="text-lg font-medium">{project.title}</h3>
                <p className="text-sm text-white/80">{project.year || 'Unknown'}</p>
                {project.company_name && (
                  <p className="text-xs text-white/60">
                    Project in {project.company_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  }, [visibleItems, observeElement, infiniteScrollConfig.bidirectional, images, projects, handleImageClick]);

  return (
    <div className="relative h-screen">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto bg-black no-scrollbar"
        id={`simple-swiper-${side}`}
      >
        <div className="w-full">
          {imageElements}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});