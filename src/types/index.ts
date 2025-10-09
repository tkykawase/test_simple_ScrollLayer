// src/types/index.ts
export interface Project {
  id: string;
  title: string;
  description: string | null;
  year: string;
  tags: string[];
created_at: string;
  updated_at: string;
  user_id: string | null;
  company_name?: string;
  project_images: ProjectImage[];
}

export interface ProjectImage {
  id: string;
image_url: string;
  is_thumbnail: boolean;
  show_in_home: boolean;
  in_project_order: number;
  photographer_name?: string;
  caption?: string;
  status: boolean;
  tags?: string[];
  media_type?: 'image' | 'video'; // メディアタイプを追加
  video_url?: string; // 動画URL（動画の場合）
  thumbnail_url?: string; // 動画のサムネイルURL
}

export interface SwipeItem {
  id: string;
  imageUrl: string;
  title?: string;
}

// 無限スクロール用の設定インターフェース（94版の拡張を統合）
export interface InfiniteScrollConfig {
  items: SwipeItem[];
maxRenderedItems?: number;
  bufferSize?: number;
  rootMargin?: string;                 // 94版で最適化済み
  timeout?: number;
  threshold?: number;
  enabled?: boolean;
  bidirectional?: boolean;
// 双方向無限スクロール
  boundaryConfig?: BoundaryElementConfig; // 94版から統合
}

// 境界要素の配置設定（94版から統合）
export interface BoundaryElementConfig {
  ensureVisibility?: boolean;          // 境界要素の可視性保証
  repositionThreshold?: number;
// 再配置のしきい値（px）
  safeMargin?: number;                // 安全マージン（px）
  autoAdjustment?: boolean;           // 自動調整の有効/無効
}

// 境界要素の状態情報（94版から統合）
export interface BoundaryElementState {
  direction: 'prepend' |
'append';
  isVisible: boolean;
  distanceFromViewport: number;
  needsRepositioning: boolean;
  lastChecked: number;
}

// 無限スクロールの状態管理用（94版の拡張を統合）
export interface InfiniteScrollState {
  visibleItems: SwipeItem[];
  isLoading: boolean;
hasReachedEnd: boolean;
  currentIndex: number;
  boundaryElements?: {                 // 94版から統合
    prepend?: BoundaryElementState;
append?: BoundaryElementState;
  };
}

// 境界要素の可視性チェック結果（94版から統合）
export interface BoundaryVisibilityResult {
  isVisible: boolean;
  direction: 'prepend' | 'append';
  elementRect: DOMRect;
  containerRect: DOMRect;
intersectionRatio: number;
  needsAdjustment: boolean;
  recommendedAction?: 'reposition' | 'increase_margin' | 'none';
}

export interface ImageLoaderOptions {
  quality?: number;
  width?: number;
}

export interface ProjectStore {
  projects: Project[];
  selectedTags: string[];
  selectedImageTags: string[];
  isDrawerOpen: boolean;
  isGridVisible: boolean;
  setProjects: (projects: Project[]) => void;
  toggleTag: (tag: string) => void;
  toggleImageTag: (tag: string) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  toggleGridVisible: () => void;
  setGridVisible: (isVisible: boolean) => void;
}
