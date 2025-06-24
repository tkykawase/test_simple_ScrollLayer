// src/components/swiper/SimpleSwiper.tsx
// DualLayerControllerV2対応版（重ね合わせ下層・クリック有効）

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/lib/image-utils';
import { useInfiniteScroll } from './useInfiniteScroll';
import type { InfiniteScrollConfig, Project, ProjectImage } from '../../types';

interface SwiperController {
  registerSimpleSwiper: (element: HTMLDivElement) => void;
  unregisterSimpleSwiper: () => void;
}

interface SimpleSwiperProps {
  images: string[];                    // 表示する画像URLの配列
  projects: Project[];                 // プロジェクト情報
  side: 'left' | 'right';             // 左右どちらのスワイパーか
  controller?: SwiperController;       // DualLayerControllerV2（オプション）
}

export const SimpleSwiper = React.memo(function SimpleSwiper({
  images,
  projects,
  side,
  controller
}: SimpleSwiperProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // DualLayerControllerV2への登録
  useEffect(() => {
    if (controller && containerRef.current) {
      controller.registerSimpleSwiper(containerRef.current);
      console.log('✅ SimpleSwiper registered to DualLayerControllerV2', { 
        side,
        mode: 'overlay-bottom-layer',
        clickEnabled: true
      });
      
      return () => {
        controller.unregisterSimpleSwiper();
        console.log('❌ SimpleSwiper unregistered from DualLayerControllerV2', { side });
      };
    }
  }, [controller, side]);

  // 無限スクロール設定（94版の最適化済み設定を統合）
  const infiniteScrollConfig: InfiniteScrollConfig = useMemo(() => ({
    items: (images || []).map((url, index) => ({
      id: `item-${side}-${index}`,
      imageUrl: url,
      title: `Image ${side} ${index + 1}`
    })),
    maxRenderedItems: 15,    // 94版の最適値
    bufferSize: 8,          // 94版の最適値
    rootMargin: '200px',    // 94版の最適化済み値
    timeout: 16,
    preloadMultiplier: 3,
    threshold: 0.1,
    enabled: true,
    bidirectional: true     // 双方向無限スクロール
  }), [images, side]);

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

  // 🎯 画像クリック時のナビゲーション（重ね合わせ対応・クリック貫通受け取り）
  const handleImageClick = useCallback((imageUrl: string) => {
    const project = projects.find(p => 
      p.project_images?.some((img: ProjectImage) => img.image_url === imageUrl)
    );
    
    if (project) {
      console.log('🎯 SimpleSwiper navigation (from click-through)', {
        side,
        projectId: project.id,
        projectTitle: project.title,
        overlayMode: true,
        clickSource: 'bottom-layer'
      });
      navigate(`/project/${project.id}`);
    }
  }, [projects, navigate, side]);

  // 表示用の画像データを準備（重ね合わせ対応版）
  const imageElements = useMemo(() => {
    // 無限スクロールが有効な場合は visibleItems を使用
    // そうでなければ既存の images を使用
    const displayItems = visibleItems.length > 0 
      ? visibleItems 
      : (images || []).map((url, index) => ({ 
          id: `fallback-${side}-${index}`, 
          imageUrl: url, 
          title: `Image ${side} ${index + 1}` 
        }));

    console.log('🖼️ SimpleSwiper preparing images (overlay bottom layer)', {
      side,
      displayItemsCount: displayItems.length,
      visibleItemsCount: visibleItems.length,
      originalImagesCount: images.length,
      overlayMode: true,
      clickEnabled: true
    });

    return displayItems.map((item, index) => {
      const project = projects.find(p => 
        p.project_images?.some((img: ProjectImage) => img.image_url === item.imageUrl)
      );

      if (!project) {
        console.warn('⚠️ Project not found for image', {
          side,
          imageUrl: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1, item.imageUrl.lastIndexOf('/') + 10),
          itemId: item.id,
          overlayMode: true
        });
        return null;
      }

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
                console.log('🔍 Observing first element for prepend (overlay mode)', {
                  side,
                  itemId: item.id,
                  direction: 'prepend'
                });
              } else if (isLastItem) {
                // 最後の要素を下方向監視（94版の境界要素配置最適化済み）
                observeElement(el, 'append');
                console.log('🔍 Observing last element for append (overlay mode)', {
                  side,
                  itemId: item.id,
                  direction: 'append'
                });
              }
            }
          }}
          className="relative cursor-pointer"
          onClick={() => handleImageClick(item.imageUrl)}
          style={{
            // 🎯 重要: クリックを確実に受け取るためのpointer-events設定
            pointerEvents: 'auto'
          }}
        >
          <img
            src={getImageUrl(item.imageUrl, { width: 800, quality: 80 })}
            alt={project.title || 'Project Image'}
            className="w-full block select-none"
            loading="lazy"
            decoding="async"
            style={{
              // 🎯 画像自体もクリック可能に
              pointerEvents: 'auto'
            }}
            onError={(e) => {
              console.error('❌ Image failed to load (overlay mode)', { 
                side,
                url: item.imageUrl,
                itemId: item.id,
                overlayMode: true
              });
              e.currentTarget.src = 'https://picsum.photos/800/600?text=Error';
            }}
          />
          
          {/* ホバー時の情報オーバーレイ（重ね合わせ対応版） */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{
              // オーバーレイもクリック可能に
              pointerEvents: 'auto'
            }}
          >
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <div className="text-white">
                <h3 className="text-lg font-medium">{project.title}</h3>
                <p className="text-sm text-white/80">{project.year || 'Unknown'}</p>
                {project.company_name && (
                  <p className="text-xs text-white/60">
                    Project in {project.company_name}
                  </p>
                )}
                {/* 重ね合わせモード情報表示 */}
                <p className="text-xs text-white/50 mt-1">
                  Side: {side} | Mode: Overlay | Click: Enabled
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  }, [visibleItems, observeElement, infiniteScrollConfig.bidirectional, images, projects, handleImageClick, side]);

  // 重ね合わせモード統計情報をログ出力
  useEffect(() => {
    if (visibleItems.length > 0) {
      console.log('📊 SimpleSwiper overlay statistics', {
        side,
        totalVisibleItems: visibleItems.length,
        totalOriginalImages: images.length,
        isLoading: isLoading,
        containerElement: containerRef.current?.id || 'unknown',
        overlayMode: true,
        layerPosition: 'bottom',
        clickEnabled: true,
        cycleInfo: {
          expectedCycles: Math.ceil(visibleItems.length / images.length),
          remainder: visibleItems.length % images.length
        }
      });
    }
  }, [visibleItems.length, images.length, side, isLoading]);

  return (
    <div className="relative h-screen">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto bg-black no-scrollbar"
        id={`simple-swiper-${side}`}
        style={{
          // 🎯 重要: 下層として確実にクリックを受け取る
          pointerEvents: 'auto'
        }}
      >
        <div className="w-full">
          {imageElements}
          {isLoading && (
            <div 
              className="flex justify-center py-4"
              style={{ pointerEvents: 'none' }} // ローディング表示はクリック無効
            >
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
      
      {/* 重ね合わせモード情報表示（デバッグ用） */}
      <div 
        className="absolute bottom-20 left-2 bg-black/70 text-white p-2 rounded text-xs"
        style={{ pointerEvents: 'auto' }} // デバッグ表示はクリック可能
      >
        <p>SimpleSwiper {side} (Overlay)</p>
        <p>Layer: Bottom (z-0)</p>
        <p>Images: {visibleItems.length}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Click: Enabled (Click-Through)</p>
        <p>Controller: {controller ? 'V2 Connected' : 'Standalone'}</p>
      </div>
    </div>
  );
});