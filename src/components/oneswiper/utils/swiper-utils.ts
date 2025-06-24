// スワイパー用ユーティリティ関数

// 境界ID生成
export function getBoundaryId(type: 'top' | 'bottom' | 'set', side: 'left' | 'right', setNumber?: number) {
  if (type === 'top') return `boundary-top-${side}`;
  if (type === 'bottom') return `boundary-bottom-${side}`;
  if (type === 'set' && setNumber !== undefined) return `boundary-set-${side}-${setNumber}`;
  return '';
}

// セットID生成
export function getSetId(side: 'left' | 'right', setNumber: number) {
  return `set-${side}-${setNumber}`;
}

// スクロール方向判定
export function getScrollDirection(prev: number, next: number): 'up' | 'down' {
  return next > prev ? 'down' : 'up';
} 