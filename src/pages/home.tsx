// src/pages/home.tsx
import React from 'react';
import { SimpleSwiper } from '../components/swiper';
import { ScrollLayer } from '../components/swiper/ScrollLayer';
import { useDualLayerControllerV2 } from '../components/swiper/useDualLayerControllerV2';
import type { SwipeItem } from '../types';

// サンプルデータ（左用）- 確実に動作する画像URL
const sampleItemsLeft: SwipeItem[] = [
  {
    id: '1',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    title: 'サンプル画像 左1'
  },
  {
    id: '2',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    title: 'サンプル画像 左2'
  },
  {
    id: '3',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    title: 'サンプル画像 左3'
  },
  {
    id: '4',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    title: 'サンプル画像 左4'
  },
  {
    id: '5',
    imageUrl: 'https://picsum.photos/800/600?random=5',
    title: 'サンプル画像 左5'
  },
  {
    id: '6',
    imageUrl: 'https://picsum.photos/800/600?random=6',
    title: 'サンプル画像 左6'
  }
];

// サンプルデータ（右用）- 確実に動作する画像URL
const sampleItemsRight: SwipeItem[] = [
  {
    id: '7',
    imageUrl: 'https://picsum.photos/800/600?random=7',
    title: 'サンプル画像 右1'
  },
  {
    id: '8',
    imageUrl: 'https://picsum.photos/800/600?random=8',
    title: 'サンプル画像 右2'
  },
  {
    id: '9',
    imageUrl: 'https://picsum.photos/800/600?random=9',
    title: 'サンプル画像 右3'
  },
  {
    id: '10',
    imageUrl: 'https://picsum.photos/800/600?random=10',
    title: 'サンプル画像 右4'
  },
  {
    id: '11',
    imageUrl: 'https://picsum.photos/800/600?random=11',
    title: 'サンプル画像 右5'
  },
  {
    id: '12',
    imageUrl: 'https://picsum.photos/800/600?random=12',
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
  // 重ね合わせ専用コントローラーを初期化
  const dualLayerController = useDualLayerControllerV2();

  return (
    <div className="fixed inset-0 w-screen h-screen flex">
      {/* 左側：レイヤー重ね合わせエリア */}
      <div className="w-1/2 h-full border-r border-gray-300 relative">
        {/* 下層：無限スワイパー左（表示専用・画像クリック有効） */}
        <div className="absolute inset-0 z-0">
          {/* 表示専用インジケーター */}
          <div className="absolute top-4 left-4 z-20 bg-blue-600/90 text-white p-2 rounded shadow text-sm">
            <p className="font-medium">無限左（下層）</p>
            <p className="text-blue-100">表示 + クリック</p>
          </div>
          
          <SimpleSwiper 
            images={sampleItemsLeft.map(item => item.imageUrl)}
            projects={sampleProjectsLeft}
            side="left"
            controller={{
              registerSimpleSwiper: (element) => 
                dualLayerController.registerSimpleSwiper('infinite-left', element),
              unregisterSimpleSwiper: () => 
                dualLayerController.unregisterSimpleSwiper('infinite-left')
            }}
          />
        </div>

        {/* 上層：スクロール用レイヤー左（操作専用・透明・クリック貫通） */}
        <div className="absolute inset-0 z-10">
          {/* 操作専用インジケーター */}
          <div className="absolute top-4 right-4 z-20 bg-green-600/90 text-white p-2 rounded shadow text-sm">
            <p className="font-medium">操作左（上層）</p>
            <p className="text-green-100">スクロール専用</p>
          </div>
          
          <ScrollLayer 
            onScroll={(deltaY) => 
              dualLayerController.handleScrollLayerMove('scroll-left', deltaY)
            } 
            onImageClick={(x, y) => {
              // クリックはpointer-eventsで下層に貫通するため、このハンドラーは使用されない
              console.log('ScrollLayer click (should not fire)', { x, y });
            }}
            controller={{
              registerScrollLayer: (element) => 
                dualLayerController.registerScrollLayer('scroll-left', element),
              unregisterScrollLayer: () => 
                dualLayerController.unregisterScrollLayer('scroll-left')
            }}
          />
        </div>
      </div>

      {/* 右側：レイヤー重ね合わせエリア */}
      <div className="w-1/2 h-full relative">
        {/* 下層：無限スワイパー右（表示専用・画像クリック有効） */}
        <div className="absolute inset-0 z-0">
          {/* 表示専用インジケーター */}
          <div className="absolute top-4 left-4 z-20 bg-purple-600/90 text-white p-2 rounded shadow text-sm">
            <p className="font-medium">無限右（下層）</p>
            <p className="text-purple-100">表示 + クリック</p>
          </div>
          
          <SimpleSwiper 
            images={sampleItemsRight.map(item => item.imageUrl)}
            projects={sampleProjectsRight}
            side="right"
            controller={{
              registerSimpleSwiper: (element) => 
                dualLayerController.registerSimpleSwiper('infinite-right', element),
              unregisterSimpleSwiper: () => 
                dualLayerController.unregisterSimpleSwiper('infinite-right')
            }}
          />
        </div>

        {/* 上層：スクロール用レイヤー右（操作専用・透明・クリック貫通） */}
        <div className="absolute inset-0 z-10">
          {/* 操作専用インジケーター */}
          <div className="absolute top-4 right-4 z-20 bg-orange-600/90 text-white p-2 rounded shadow text-sm">
            <p className="font-medium">操作右（上層）</p>
            <p className="text-orange-100">スクロール専用</p>
          </div>
          
          <ScrollLayer 
            onScroll={(deltaY) => 
              dualLayerController.handleScrollLayerMove('scroll-right', deltaY)
            } 
            onImageClick={(x, y) => {
              // クリックはpointer-eventsで下層に貫通するため、このハンドラーは使用されない
              console.log('ScrollLayer click (should not fire)', { x, y });
            }}
            controller={{
              registerScrollLayer: (element) => 
                dualLayerController.registerScrollLayer('scroll-right', element),
              unregisterScrollLayer: () => 
                dualLayerController.unregisterScrollLayer('scroll-right')
            }}
          />
        </div>
      </div>

      {/* 統合制御状態の表示（デバッグ用） */}
      <div className="absolute bottom-4 right-4 bg-indigo-600/90 text-white p-3 rounded shadow text-sm">
        <p className="font-medium">🔄 DualLayerV2制御</p>
        <p className="text-indigo-100">重ね合わせモード</p>
        <div className="mt-2 text-xs">
          <p>下層: 表示 + クリック</p>
          <p>上層: スクロール専用</p>
          <p>制御: pointer-events分離</p>
        </div>
        <div className="mt-2 text-xs border-t border-indigo-400 pt-2">
          <p>🎯 同期ルール:</p>
          <p>左操作 → 左順行・右逆行</p>
          <p>右操作 → 右順行・左逆行</p>
        </div>
      </div>

      {/* 操作ガイド */}
      <div className="absolute bottom-4 left-4 bg-teal-600/90 text-white p-3 rounded shadow text-sm">
        <p className="font-medium">📱 重ね合わせガイド</p>
        <div className="mt-1 text-xs">
          <p>・左右どこでもスクロール可能</p>
          <p>・画像クリックで自動ナビゲーション</p>
          <p>・上層が透明でクリック貫通</p>
          <p>・ジャンプなしスムーズスクロール</p>
        </div>
      </div>

      {/* 同期状態モニター */}
      <div className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded text-xs">
        <p>DualLayerV2 Status:</p>
        <p>Mode: Overlay</p>
        <p>Active: {dualLayerController.getStatus().lastSyncSource || 'None'}</p>
        <p>Syncing: {dualLayerController.getStatus().isSyncing ? 'Yes' : 'No'}</p>
        <p>Click-Through: Enabled</p>
      </div>
    </div>
  );
}