// src/lib/image-utils.ts

import { ImageLoaderOptions } from '@/types';

// ファイル拡張子からメディアタイプを判別する関数
export const getMediaTypeFromUrl = (url: string): 'image' | 'video' => {
  if (!url) return 'image';
  
  const extension = url.toLowerCase().split('.').pop();
  const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
  
  return videoExtensions.includes(extension || '') ? 'video' : 'image';
};

// 動画URLを取得する関数
export const getVideoUrl = (videoPath: string): string => {
  if (!videoPath) return '';
  
  // 既に完全なURLの場合はそのまま返す
  if (videoPath.startsWith('http')) {
    return videoPath;
  }
  
  // Clean the video path
  const cleanPath = videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
  
  try {
    const url = new URL(
      `storage/v1/object/public/images/${cleanPath}`,
      import.meta.env.VITE_SUPABASE_URL
    );
    
    return url.toString();
  } catch {
    return '';
  }
};

export const getImageUrl = (imagePath: string, options: ImageLoaderOptions = {}): string => {
  if (!imagePath) return 'https://placehold.co/600x400?text=No+Image';
  
  // デフォルトの品質と幅を設定
  const quality = options.quality || 80;
  const width = options.width || 1200; // 適切なデフォルト幅を設定
  
  // If it's already a full URL, apply transformations if it's an Unsplash image
  if (imagePath.startsWith('http')) {
    if (imagePath.includes('images.unsplash.com')) {
      const url = new URL(imagePath);
      // Apply quality and format optimizations
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('fm', 'webp'); // WebPフォーマットを使用
      url.searchParams.set('w', width.toString());
      return url.toString();
    }
    return imagePath;
  }

  // Clean the image path
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  try {
    const url = new URL(
      `storage/v1/object/public/images/${cleanPath}`,
      import.meta.env.VITE_SUPABASE_URL
    );

    // Add transformation parameters for Supabase Storage
    url.searchParams.set('width', width.toString());
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('format', 'webp'); // WebPフォーマットを使用（Supabaseが対応している場合）
    
    return url.toString();
  } catch {
    return 'https://placehold.co/600x400?text=Error+Loading+Image';
  }
};

// 画像プリロード関数を強化
export const preloadImage = (src: string): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
  
  // 実際の画像も事前に読み込み
  const img = new Image();
  img.src = src;
};

// 遅延読み込みの設定を最適化
export const setupLazyLoading = (): void => {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: 'px 0px', // より早くプリロードするため余白を大きく
    threshold: 0.01
  });

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });
};

// バッチで画像をプリロード
export const preloadBatch = (imagePaths: string[], options: ImageLoaderOptions = {}): void => {
  // 最初の数枚だけをプリロード
  const batchSize = 3;
  imagePaths.slice(0, batchSize).forEach(path => {
    preloadImage(getImageUrl(path, options));
  });
};
