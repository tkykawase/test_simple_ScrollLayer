import type { SetData, SwiperStepsState } from './swiper-types';

// =============================
// swiperSetManager.ts
// このモジュールは、スワイパーの「セット」の状態管理ロジックを提供します。
// 無限スクロールのためのセットの追加・削除操作に特化しています。
// =============================

/**
 * 新しいセットを生成する
 * @param setNumber - 新しいセット番号
 * @param imageSet - 使用する画像の配列
 * @param side - スワイパーが左右どちらか
 * @returns 新しいセットデータ
 */
const generateSet = (setNumber: number, imageSet: string[], side: 'left' | 'right'): SetData => ({
  id: `set-${side}-${setNumber}`,
  setNumber,
  images: imageSet,
  side
});

/**
 * 上にセットを追加し、下からセットを削除する
 * @param state - 現在の状態
 * @returns 更新された状態
 */
export const addSetToTopAndRemoveFromBottom = (state: SwiperStepsState): SwiperStepsState => {
  const newSetNumber = state.setCounter + 1;
  const newSet = generateSet(newSetNumber, state.imageSet, state.currentSets[0].side);
  
  console.log(`🔄 セット操作（上追加・下削除）: Set${newSetNumber}`);
  
  return {
    ...state,
    currentSets: [newSet, ...state.currentSets.slice(0, -1)],
    setCounter: newSetNumber
  };
};

/**
 * 下にセットを追加し、上からセットを削除する
 * @param state - 現在の状態
 * @returns 更新された状態
 */
export const addSetToBottomAndRemoveFromTop = (state: SwiperStepsState): SwiperStepsState => {
  const newSetNumber = state.setCounter + 1;
  const newSet = generateSet(newSetNumber, state.imageSet, state.currentSets[0].side);
  
  console.log(`🔄 セット操作（下追加・上削除）: Set${newSetNumber}`);
  
  return {
    ...state,
    currentSets: [...state.currentSets.slice(1), newSet],
    setCounter: newSetNumber
  };
};

// Note:
// addSetToTop, addSetToBottom, removeSetFromTop, removeSetFromBottom は
// addSetToTopAndRemoveFromBottom と addSetToBottomAndRemoveFromTop の機能に包含されており、
// 現在のコードでは直接呼び出されていないため、移植から除外しました。
// これにより、APIがよりシンプルになります。 