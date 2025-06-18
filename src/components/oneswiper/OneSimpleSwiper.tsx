import { useEffect } from 'react';
import { useSwiperSteps } from './useSwiperSteps';

interface OneSimpleSwiperProps {
  images: string[];
  setCount?: number;
}

export const OneSimpleSwiper = ({ images, setCount = 5 }: OneSimpleSwiperProps) => {
  const [state, actions] = useSwiperSteps();

  // 初期化トリガー
  useEffect(() => {
    if (state.currentStep === 'step1' && state.isLoading) {
      actions.initializeStep1(images);
    }
  }, [images, state.currentStep, state.isLoading, actions]);

  // Step 2 自動進行
  useEffect(() => {
    if (state.currentStep === 'step2') {
      actions.completeStep2();
    }
  }, [state.currentStep, actions]);

  // Step 3 自動進行（DOM準備後）
  useEffect(() => {
    if (state.currentStep === 'step3' && state.imageSet.length > 0) {
      actions.measureStep3();
    }
  }, [state.currentStep, state.imageSet.length, actions]);

  // Step 4 自動進行
  useEffect(() => {
    if (state.currentStep === 'step4' && state.setHeight > 0) {
      actions.enableStep4();
    }
  }, [state.currentStep, state.setHeight, actions]);

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
      {/* シンプルなスクロール可能コンテナ */}
      <div className="w-full h-full overflow-y-auto">
        {/* Step 4完了後: 上端境界線（最初のセットの前） */}
        {state.showBoundaries && state.currentStep === 'completed' && (
          <div className="w-full h-1 bg-red-500 opacity-70" 
               style={{ pointerEvents: 'none' }} />
        )}

        {/* Step 2完了後: 最初のセット（高さ測定用） */}
        {(state.currentStep === 'step3' || state.currentStep === 'step4' || state.currentStep === 'completed') && (
          <div className="measurement-set relative w-full">
            {state.imageSet.map((src, imageIndex) => (
              <div 
                key={`set1-${imageIndex}`}
                className="relative w-full"
                onClick={() => console.log(`📱 Set1-Image${imageIndex + 1} clicked`)}
              >
                <img 
                  src={src} 
                  alt={`Set 1, Image ${imageIndex + 1}`}
                  className="w-full h-auto block"
                  loading="eager"
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 3完了後: 残りのセット（セット間境界線付き） */}
        {(state.currentStep === 'completed') && state.setHeight > 0 && 
          Array(setCount - 1).fill(0).map((_, setIndex) => {
            const actualSetNumber = setIndex + 2;
            return (
              <div key={`set-container-${actualSetNumber}`}>
                {/* セット間境界線 */}
                {state.showBoundaries && (
                  <div className="w-full h-1 bg-red-500 opacity-70" 
                       style={{ pointerEvents: 'none' }} />
                )}
                
                {/* セット本体 */}
                <div className="relative w-full">
                  {state.imageSet.map((src, imageIndex) => (
                    <div 
                      key={`set${actualSetNumber}-${imageIndex}`}
                      className="relative w-full"
                      onClick={() => console.log(`📱 Set${actualSetNumber}-Image${imageIndex + 1} clicked`)}
                    >
                      <img 
                        src={src} 
                        alt={`Set ${actualSetNumber}, Image ${imageIndex + 1}`}
                        className="w-full h-auto block"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        }

        {/* Step 4完了後: 下端境界線（最後のセットの後） */}
        {state.showBoundaries && state.currentStep === 'completed' && (
          <div className="w-full h-1 bg-red-500 opacity-70" 
               style={{ pointerEvents: 'none' }} />
        )}
      </div>
      
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 left-0 bg-black/90 text-white p-3 text-xs z-50 font-mono">
          <div className="text-green-400">🎯 OneSimpleSwiper (Step管理版)</div>
          <div>現在のステップ: {state.currentStep}</div>
          <div>1セット高さ: {state.setHeight}px</div>
          <div>総高さ: {state.setHeight * setCount}px</div>
          <div>セット数: {setCount}</div>
          <div>画像数/セット: {state.imageSet.length}</div>
          <div>境界線: {state.showBoundaries ? '✅' : '❌'}</div>
          <div className="mt-1">
            <div className="text-yellow-300">進捗:</div>
            <div>Step1 {state.currentStep !== 'step1' ? '✅' : '⏳'} 画像読み込み</div>
            <div>Step2 {['step3','step4','completed'].includes(state.currentStep) ? '✅' : '⏳'} セット複製</div>
            <div>Step3 {['step4','completed'].includes(state.currentStep) ? '✅' : '⏳'} 高さ測定</div>
            <div>Step4 {state.currentStep === 'completed' ? '✅' : '⏳'} 境界線(上端・セット間・下端)</div>
          </div>
        </div>
      )}
    </div>
  );
};