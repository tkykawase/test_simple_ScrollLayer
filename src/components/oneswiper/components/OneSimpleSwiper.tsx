import { useSwiperController } from '../hooks/useSwiperController';
import { ScrollLayer } from './ScrollLayer';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getImageUrl, getMediaTypeFromUrl, getVideoUrl } from '../../../lib/image-utils';
import type { Project } from '../../../types';
import { useNavigate } from 'react-router-dom';

interface OneSimpleSwiperProps {
  images: string[];
  setCount?: number;
  side: 'left' | 'right';
  projects: Project[];
}

// 画像オーバーレイ用コンポーネント
interface ImageOverlayProps {
  title: string;
  year: string;
  company_name: string;
  photographer_name: string;
}

const ImageOverlay: React.FC<ImageOverlayProps> = ({ title, year, company_name, photographer_name }) => (
  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
    <div className="absolute inset-0 flex flex-col justify-end p-4">
      <div className="text-white">
        <h3 className="text-lg font-medium whitespace-pre-line">{title}</h3>
        <p className="text-sm text-white/80 whitespace-pre-line">{year}</p>
        {company_name && (
          <p className="text-xs text-white/60 whitespace-pre-line">{company_name}</p>
        )}
        {photographer_name && (
          <p className="text-xs text-white/60 whitespace-pre-line">Photo: {photographer_name}</p>
        )}
      </div>
    </div>
  </div>
);

export const OneSimpleSwiper: React.FC<OneSimpleSwiperProps> = ({ images, setCount = 5, side, projects }) => {
  const navigate = useNavigate();
  const {
    state,
    actions,
    contentRef,
    addForce,
    debugScrollTop,
    setLastTotalDelta,
    lastTotalDelta,
    isProcessingRef,
    observerRef,
    velocityRef
  } = useSwiperController(images, side);

  // オートスクロール速度(px/sec)を管理
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0);
  const lastAutoScrollRef = useRef({ scrollTop: 0, timestamp: performance.now() });
  const speedBufferRef = useRef<number[]>([]); // 直近Nフレームの速度バッファ
  const N = 5; // 平均化するフレーム数

  // ScrollLayerから速度を受け取るコールバック
  const handleAutoScroll = useCallback(() => {
    if (contentRef.current) {
      const now = performance.now();
      const currentScrollTop = contentRef.current.scrollTop;
      const delta = currentScrollTop - lastAutoScrollRef.current.scrollTop;
      const dt = now - lastAutoScrollRef.current.timestamp;
      if (dt > 0) {
        const speed = delta / (dt / 1000); // px/sec
        // 速度が0.1px/sec未満は無視
        if (Math.abs(speed) > 0.1) {
          // バッファに追加
          speedBufferRef.current.push(speed);
          if (speedBufferRef.current.length > N) {
            speedBufferRef.current.shift();
          }
          // 平均速度を計算
          const avgSpeed = speedBufferRef.current.reduce((a, b) => a + b, 0) / speedBufferRef.current.length;
          setAutoScrollSpeed(avgSpeed);
        }
        // 速度が0.1未満ならsetしない（前回値を維持）
      }
      lastAutoScrollRef.current = { scrollTop: currentScrollTop, timestamp: now };
    }
  }, [contentRef]);

  // スクロール位置を定期的にコンソールに出力（必ずトップレベルで呼ぶ）
  useEffect(() => {
    const interval = setInterval(() => {
      if (contentRef.current) {
        const scrollTop = Math.round(contentRef.current.scrollTop);
        const clientHeight = Math.round(contentRef.current.clientHeight);
        const scrollHeight = Math.round(contentRef.current.scrollHeight);
        console.log(
          `[${side}] 表示位置: scrollTop=${scrollTop} px, clientHeight=${clientHeight} px, scrollHeight=${scrollHeight} px, 表示範囲: ${scrollTop} ~ ${scrollTop + clientHeight} px`
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [contentRef, side]);

  // ローディング中
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            Step 1: Loading {images.length} images...
          </p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (state.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-lg mb-2">初期化エラー</p>
          <p className="text-sm">{state.error}</p>
          <button 
            onClick={actions.reset}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            リトライ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* デバッグ情報 - 非表示（localStorage.setItem('show_debug_ui', 'true')で表示） */}
      {process.env.NODE_ENV === 'development' && localStorage.getItem('show_debug_ui') === 'false' && (
        <div className={`fixed top-0 ${side === 'left' ? 'left-0' : 'right-0'} bg-black/90 text-white p-3 text-xs z-50 font-mono`}>
          <div className="text-green-400">🎯 OneSimpleSwiper デバッグ</div>
          <div>現在のステップ: {state.currentStep}</div>
          <div>1セット高さ: {state.setHeight}px</div>
          <div>画像数/セット: {state.imageSet.length}</div>
          <div>表示セット数: {state.currentSets.length}</div>
          <div>セットカウンター: {state.setCounter}</div>
          <div>ScrollLayer: {state.currentStep === 'completed' ? '✅ 有効' : '❌ 待機'}</div>
          <div>クリック有効: ✅</div>
          <div className="border-t border-gray-600 mt-2 pt-2">
            <div className="text-pink-400">🪟 スクロール状態</div>
            <div>scrollTop: {contentRef.current ? Math.round(contentRef.current.scrollTop) : 'N/A'} px</div>
            <div>clientHeight: {contentRef.current ? Math.round(contentRef.current.clientHeight) : 'N/A'} px</div>
            <div>scrollHeight: {contentRef.current ? Math.round(contentRef.current.scrollHeight) : 'N/A'} px</div>
            <div>表示範囲: {contentRef.current ? `${Math.round(contentRef.current.scrollTop)} ~ ${Math.round(contentRef.current.scrollTop + contentRef.current.clientHeight)}` : 'N/A'} px</div>
            <div>端判定: {
              contentRef.current
                ? (contentRef.current.scrollTop <= 0
                    ? '⬆️ 上端'
                    : (contentRef.current.scrollTop + contentRef.current.clientHeight >= contentRef.current.scrollHeight - 1
                        ? '⬇️ 下端'
                        : '◀️ 中間'))
                : 'N/A'
            }</div>
            <div className="text-cyan-400">オートスクロール速度: {Math.round(autoScrollSpeed)} px/sec</div>
            <div className="text-cyan-400">現在の慣性: {velocityRef ? Math.round(velocityRef.current) : 0} px/frame</div>
          </div>
          <div className="border-t border-gray-600 mt-2 pt-2">
            <div className="text-yellow-400">🔄 制御状態</div>
            <div>処理中: {isProcessingRef.current ? '⏳ 処理中' : '✅ 待機中'}</div>
            <div>スクロール位置: {Math.round(debugScrollTop)}px</div>
            <div>最終移動量: {lastTotalDelta}px</div>
            <div>コンテナ高: {contentRef.current?.scrollHeight || 0}px</div>
            <div>ScrollLayer高: {state.setHeight * setCount}px</div>
            <div>境界線数: {observerRef.current ? document.querySelectorAll('[id^="boundary-"]').length : 0}</div>
            <div>監視状態: {observerRef.current ? '✅ 監視中' : '❌ 停止中'}</div>
          </div>
          {/* 🔥 追加: 境界要素の安定性情報 */}
          <div className="border-t border-gray-600 mt-2 pt-2">
            <div className="text-blue-400">🛡️ 境界安定化</div>
            <div>クールダウン: 500ms</div>
            <div>最大連続: 3回</div>
            <div>rootMargin: 50px</div>
            <div>threshold: [0, 0.1]</div>
          </div>
        </div>
      )}

      {/* ScrollLayer（Step 4完了後に有効化） */}
      <ScrollLayer 
        side={side}
        onWheelDelta={addForce}
        onScrollEnd={setLastTotalDelta}
        height={state.setHeight}
        isEnabled={state.currentStep === 'completed' && state.setHeight > 0}
        onAutoScroll={handleAutoScroll}
      />

      {/* コンテンツレイヤー */}
      <div 
        ref={contentRef}
        className="w-full h-full overflow-y-auto hide-scrollbar no-scrollbar"
        data-content-layer="true"
        style={{ 
          zIndex: 0,
          pointerEvents: 'auto' // 常にクリックイベントを有効にする
        }}
      >
        {/* Step 4完了後: 上端境界線（最初のセットの前） */}
        {state.showBoundaries && state.currentStep === 'completed' && (
          <div 
            id={`boundary-top-${side}`}
            className="w-full bg-gray-700 opacity-50" 
            style={{ 
              pointerEvents: 'none', 
              height: '1px' 
            }} 
          />
        )}

        {/* 動的セット表示 */}
        {state.currentSets.map((set, setIndex) => (
          <div key={`set-container-${set.id}`}>
            {/* セット間境界線（最初のセット以外） */}
            {state.showBoundaries && setIndex > 0 && (
              <div 
                id={`boundary-set-${side}-${set.setNumber}`}
                className="w-full bg-gray-700 opacity-70" 
                style={{ 
                  pointerEvents: 'none',
                  height: '1px'
                }} 
              />
            )}
                
            {/* セット本体 */}
            <div 
              id={`set-${side}-${set.setNumber}`}
              className={`relative w-full ${setIndex === 0 ? 'measurement-set' : ''}`}>
              {set.images.map((src, imageIndex) => {
                // 画像に紐づくプロジェクト情報を取得
                const project = projects.find(p => p.project_images.some(img => img.image_url === src));
                const projectImage = project?.project_images?.find(img => img.image_url === src);
                
                // ファイル拡張子からメディアタイプを判別
                const detectedMediaType = getMediaTypeFromUrl(src);
                
                // 画像ごとに必要な情報をまとめる
                const imageInfo = {
                  imageUrl: src,
                  projectId: project?.id ?? '',
                  title: project?.title ?? '',
                  year: project?.year ?? '',
                  company_name: project?.company_name ?? '',
                  photographer_name: projectImage?.photographer_name ?? '',
                  mediaType: projectImage?.media_type ?? detectedMediaType,
                  videoUrl: projectImage?.video_url || (detectedMediaType === 'video' ? getVideoUrl(src) : undefined),
                  thumbnailUrl: projectImage?.thumbnail_url,
                };
                
                // デバッグ情報を出力
                if (detectedMediaType === 'video') {
                  console.log('動画情報:', {
                    originalSrc: src,
                    detectedMediaType,
                    videoUrl: imageInfo.videoUrl,
                    projectVideoUrl: projectImage?.video_url,
                    thumbnailUrl: imageInfo.thumbnailUrl,
                    generatedVideoUrl: getVideoUrl(src)
                  });
                }
                
                return (
                  <div 
                    key={`${set.id}-${imageIndex}`}
                    className="relative w-full cursor-pointer"
                    onClick={() => {
                      if (imageInfo.projectId) {
                        navigate(`/project/${imageInfo.projectId}`);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (imageInfo.projectId) {
                        navigate(`/project/${imageInfo.projectId}`);
                      }
                    }}
                  >
                    {imageInfo.mediaType === 'video' && imageInfo.videoUrl ? (
                      <video 
                        poster={imageInfo.thumbnailUrl || undefined}
                        className="w-full h-auto block"
                        muted
                        loop
                        autoPlay
                        playsInline
                        preload="auto"
                        controls={false}
                        onClick={(e) => {
                          e.stopPropagation(); // 🔥 重要: 親のonClickを阻止
                          const video = e.currentTarget;
                          if (video.paused) {
                            video.play().catch(err => {
                              console.log('再生失敗:', err);
                            });
                          } else {
                            video.pause();
                          }
                        }}
                        onLoadedData={(e) => {
                          // 🔥 onCanPlayの代わりにonLoadedDataを使用（より確実）
                          const video = e.currentTarget;
                          if (video.paused && video.readyState >= 3) {
                            video.play().catch(() => {
                              // ブラウザポリシーで失敗した場合は無視
                            });
                          }
                        }}
                        onError={(e) => {
                          console.error('動画読み込みエラー:', {
                            src: e.currentTarget.src,
                            error: e.currentTarget.error
                          });
                        }}
                      >
                        {/* ファイル拡張子に基づいて適切なtype属性を設定 */}
                        {imageInfo.videoUrl.toLowerCase().endsWith('.webm') ? (
                          <source src={imageInfo.videoUrl} type="video/webm" />
                        ) : imageInfo.videoUrl.toLowerCase().endsWith('.mp4') ? (
                          <source src={imageInfo.videoUrl} type="video/mp4" />
                        ) : (
                          <source src={imageInfo.videoUrl} />
                        )}
                      </video>
                    ) : (
                      <img 
                        src={getImageUrl(src, { width: 800, quality: 80 })} 
                        alt={`Set ${set.setNumber}, Image ${imageIndex + 1}`}
                        className="w-full h-auto block"
                        loading={setIndex === 0 ? "eager" : "lazy"}
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                    
                    {/* オーバーレイ表示をコンポーネント化 */}
                    <ImageOverlay
                      title={imageInfo.title}
                      year={imageInfo.year}
                      company_name={imageInfo.company_name}
                      photographer_name={imageInfo.photographer_name}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Step 4完了後: 下端境界線（最後のセットの後） */}
        {state.showBoundaries && state.currentStep === 'completed' && (
          <div 
            id={`boundary-bottom-${side}`}
            className="w-full bg-gray-700 opacity-50" 
            style={{ 
              pointerEvents: 'none', 
              height: '1px'
            }} 
          />
        )}
      </div>
    </div>
  );
};