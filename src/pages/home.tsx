// src/pages/home.tsx
import React from 'react';
import { SimpleSwiper } from '../components/swiper';
import { ScrollLayer } from '../components/swiper/ScrollLayer';
import { useDualLayerController } from '../components/swiper/useDualLayerController';
import type { SwipeItem } from '../types';

// サンプルデータ
const sampleItems: SwipeItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
    title: 'サンプル画像 1'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee',
    title: 'サンプル画像 2'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1561948955-570b270e7c36',
    title: 'サンプル画像 3'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6',
    title: 'サンプル画像 4'
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006',
    title: 'サンプル画像 5'
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e',
    title: 'サンプル画像 6'
  }
];

const sampleProjects = sampleItems.map(item => ({
  ...item,
  title: item.title || 'Untitled Project',
  description: '',
  year: '2024',
  tags: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  company_name: '',
  user_id: 'sample-user',
  project_images: [{
    id: `img-${item.id}`,
    image_url: item.imageUrl,
    is_thumbnail: true,
    show_in_home: true,
    in_project_order: 0,
    status: true
  }]
}));

export function HomePage() {
  // 外部コントローラーを初期化
  const dualLayerController = useDualLayerController();

  return (
    <div className="fixed inset-0 w-screen h-screen flex">
      {/* 左半分：表示用スワイパー */}
      <div className="w-1/2 h-full border-r border-gray-300 relative">
        <div className="absolute inset-0">
          {/* 操作無効化のオーバーレイ */}
          <div 
            className="absolute inset-0 z-10 bg-transparent"
            style={{ pointerEvents: 'auto' }}
            onWheel={(e) => {
              // ホイールイベントを無効化
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              // タッチイベントを無効化
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // マウスイベントを無効化
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          
          {/* 表示専用インジケーター */}
          <div className="absolute top-4 left-4 z-20 bg-blue-600/90 text-white p-2 rounded shadow text-sm">
            <p className="font-medium">表示レイヤー</p>
            <p className="text-blue-100">操作無効（表示のみ）</p>
          </div>
          
          <SimpleSwiper 
            images={sampleItems.map(item => item.imageUrl)}
            projects={sampleProjects}
            side="left"
            controller={dualLayerController} // コントローラーを渡す
          />
        </div>
      </div>

      {/* 右半分：操作用透明レイヤー */}
      <div className="w-1/2 h-full relative overflow-hidden">
        <ScrollLayer 
          onScroll={dualLayerController.handleScrollLayerMove} 
          onImageClick={dualLayerController.handleImageClick}
          controller={dualLayerController} // コントローラーを渡す
        />
      </div>

      {/* 同期状態の表示（デバッグ用） */}
      <div className="absolute top-4 right-4 bg-green-600/90 text-white p-3 rounded shadow text-sm">
        <p className="font-medium">🔄 DualLayer制御</p>
        <p className="text-green-100">外部コントローラー使用</p>
        <div className="mt-2 text-xs">
          <p>左: 表示専用（操作無効）</p>
          <p>右: 操作専用（高精度判定）</p>
          <p>制御: 外部統合コントローラー</p>
        </div>
      </div>
    </div>
  );
}