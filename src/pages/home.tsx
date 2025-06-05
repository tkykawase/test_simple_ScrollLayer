// src/pages/home.tsx
import React from 'react';
import { SimpleSwiper } from '../components/swiper';
import { ScrollLayer } from '../components/swiper/ScrollLayer';
import { useQuadLayerController } from '../components/swiper/useQuadLayerController';
import type { SwipeItem } from '../types';

// サンプルデータ（左用）
const sampleItemsLeft: SwipeItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
    title: 'サンプル画像 左1'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee',
    title: 'サンプル画像 左2'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1561948955-570b270e7c36',
    title: 'サンプル画像 左3'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6',
    title: 'サンプル画像 左4'
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006',
    title: 'サンプル画像 左5'
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e',
    title: 'サンプル画像 左6'
  }
];

// サンプルデータ（右用）
const sampleItemsRight: SwipeItem[] = [
  {
    id: '7',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba',
    title: 'サンプル画像 右1'
  },
  {
    id: '8',
    imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e',
    title: 'サンプル画像 右2'
  },
  {
    id: '9',
    imageUrl: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e',
    title: 'サンプル画像 右3'
  },
  {
    id: '10',
    imageUrl: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24',
    title: 'サンプル画像 右4'
  },
  {
    id: '11',
    imageUrl: 'https://images.unsplash.com/photo-1415064532743-34274051115e',
    title: 'サンプル画像 右5'
  },
  {
    id: '12',
    imageUrl: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec',
    title: 'サンプル画像 右6'
  }
];

// プロジェクト情報を生成（左用）
const sampleProjectsLeft = sampleItemsLeft.map(item => ({
  ...item,
  title: item.title || 'Untitled Project Left',
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

// プロジェクト情報を生成（右用）
const sampleProjectsRight = sampleItemsRight.map(item => ({
  ...item,
  title: item.title || 'Untitled Project Right',
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
  // 4つのスワイパー統合コントローラーを初期化
  const quadLayerController = useQuadLayerController();

  return (
    <div className="fixed inset-0 w-screen h-screen flex">
      {/* 1列目：無限スワイパー左（表示専用） */}
      <div className="w-1/4 h-full border-r border-gray-300 relative">
        <div className="absolute inset-0">
          {/* 操作無効化のオーバーレイ */}
          <div 
            className="absolute inset-0 z-10 bg-transparent"
            style={{ pointerEvents: 'auto' }}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          
          {/* 表示専用インジケーター */}
          <div className="absolute top-4 left-4 z-20 bg-blue-600/90 text-white p-2 rounded shadow text-sm">
            <p className="font-medium">無限左</p>
            <p className="text-blue-100">表示専用</p>
          </div>
          
          <SimpleSwiper 
            images={sampleItemsLeft.map(item => item.imageUrl)}
            projects={sampleProjectsLeft}
            side="left"
            controller={{
              registerSimpleSwiper: (element) => 
                quadLayerController.registerSimpleSwiper('infinite-left', element),
              unregisterSimpleSwiper: () => 
                quadLayerController.unregisterSimpleSwiper('infinite-left')
            }}
          />
        </div>
      </div>

      {/* 2列目：スクロール用レイヤー左（操作専用） */}
      <div className="w-1/4 h-full border-r border-gray-300 relative overflow-hidden">
        <ScrollLayer 
          onScroll={(deltaY) => 
            quadLayerController.handleScrollLayerMove('scroll-left', deltaY)
          } 
          onImageClick={(x, y) => 
            quadLayerController.handleImageClick('scroll-left', x, y)
          }
          controller={{
            registerScrollLayer: (element) => 
              quadLayerController.registerScrollLayer('scroll-left', element),
            unregisterScrollLayer: () => 
              quadLayerController.unregisterScrollLayer('scroll-left')
          }}
        />
      </div>

      {/* 3列目：無限スワイパー右（表示専用） */}
      <div className="w-1/4 h-full border-r border-gray-300 relative">
        <div className="absolute inset-0">
          {/* 操作無効化のオーバーレイ */}
          <div 
            className="absolute inset-0 z-10 bg-transparent"
            style={{ pointerEvents: 'auto' }}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          
          {/* 表示専用インジケーター */}
          <div className="absolute top-4 left-4 z-20 bg-purple-600/90 text-white p-2 rounded shadow text-sm">
            <p className="font-medium">無限右</p>
            <p className="text-purple-100">表示専用</p>
          </div>
          
          <SimpleSwiper 
            images={sampleItemsRight.map(item => item.imageUrl)}
            projects={sampleProjectsRight}
            side="right"
            controller={{
              registerSimpleSwiper: (element) => 
                quadLayerController.registerSimpleSwiper('infinite-right', element),
              unregisterSimpleSwiper: () => 
                quadLayerController.unregisterSimpleSwiper('infinite-right')
            }}
          />
        </div>
      </div>

      {/* 4列目：スクロール用レイヤー右（操作専用） */}
      <div className="w-1/4 h-full relative overflow-hidden">
        <ScrollLayer 
          onScroll={(deltaY) => 
            quadLayerController.handleScrollLayerMove('scroll-right', deltaY)
          } 
          onImageClick={(x, y) => 
            quadLayerController.handleImageClick('scroll-right', x, y)
          }
          controller={{
            registerScrollLayer: (element) => 
              quadLayerController.registerScrollLayer('scroll-right', element),
            unregisterScrollLayer: () => 
              quadLayerController.unregisterScrollLayer('scroll-right')
          }}
        />
      </div>

      {/* 統合制御状態の表示（デバッグ用） */}
      <div className="absolute top-4 right-4 bg-green-600/90 text-white p-3 rounded shadow text-sm">
        <p className="font-medium">🔄 QuadLayer制御</p>
        <p className="text-green-100">4つのスワイパー統合</p>
        <div className="mt-2 text-xs">
          <p>無限左・右: 表示専用</p>
          <p>スクロール左・右: 操作専用</p>
          <p>制御: 統合コントローラー</p>
        </div>
        <div className="mt-2 text-xs border-t border-green-400 pt-2">
          <p>🎯 同期ルール:</p>
          <p>左操作 → 左順行・右逆行</p>
          <p>右操作 → 右順行・左逆行</p>
        </div>
      </div>

      {/* 操作ガイド */}
      <div className="absolute bottom-4 left-4 bg-yellow-600/90 text-white p-3 rounded shadow text-sm">
        <p className="font-medium">📱 操作ガイド</p>
        <div className="mt-1 text-xs">
          <p>・2列目（スクロール左）で操作</p>
          <p>・4列目（スクロール右）で操作</p>
          <p>・1,3列目は表示専用</p>
        </div>
      </div>

      {/* 同期状態モニター */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded text-xs">
        <p>QuadLayer Status:</p>
        <p>Active Controller: {quadLayerController.getStatus().lastSyncSource || 'None'}</p>
        <p>Syncing: {quadLayerController.getStatus().isSyncing ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}