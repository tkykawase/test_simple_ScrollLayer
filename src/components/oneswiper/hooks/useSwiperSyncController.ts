// Reactのフックをインポート
// useCallback: メモ化された関数を作成
// useEffect: 副作用の処理
// useRef: コンポーネントのライフサイクルを超えて値を保持
import { useCallback, useEffect, useRef } from 'react';

// 同期コントローラーの設定オプションの型定義
export type SyncControllerOptions = {
  // 同期グループを識別するID（複数のグループを作成可能）
  syncGroupId: string;
  // 各スクロールレイヤーを識別するユニークID
  layerId: string;
  // 同期をスキップするかどうかのフラグ（オプション）
  skipSync?: boolean;
};

// 同期イベントのデータ構造を定義
export type ScrollSyncEvent = {
  // スクロールの移動量
  delta: number;
  // イベントを発行したレイヤーのID
  sourceId: string;
  // イベント発生時のタイムスタンプ
  timestamp: number;
  // 同期グループID（グループ間で混信しないように）
  syncGroupId: string;
};

// シンプルなPubSubパターンを実装したイベントバスクラス
// シングルトンパターンを使用して、アプリケーション全体で単一のインスタンスを保証
class SyncEventBus {
  // シングルトンインスタンスを保持する静的フィールド
  private static instance: SyncEventBus;
  // グループIDごとのイベントリスナーを管理するMap
  // Map<グループID, Set<コールバック関数>>の構造
  private listeners: Map<string, Set<(event: ScrollSyncEvent) => void>>;

  // プライベートコンストラクタ（外部からのインスタンス化を防ぐ）
  private constructor() {
    this.listeners = new Map();
  }

  // シングルトンインスタンスを取得するメソッド
  static getInstance(): SyncEventBus {
    if (!SyncEventBus.instance) {
      SyncEventBus.instance = new SyncEventBus();
    }
    return SyncEventBus.instance;
  }

  // イベントの購読を登録するメソッド
  subscribe(groupId: string, callback: (event: ScrollSyncEvent) => void) {
    // グループIDに対応するリスナーSetが存在しない場合は作成
    if (!this.listeners.has(groupId)) {
      this.listeners.set(groupId, new Set());
    }
    // コールバックを登録
    this.listeners.get(groupId)!.add(callback);

    // クリーンアップ関数を返す（購読解除用）
    return () => {
      const listeners = this.listeners.get(groupId);
      if (listeners) {
        listeners.delete(callback);
        // リスナーがなくなった場合はグループごと削除（メモリ解放）
        if (listeners.size === 0) {
          this.listeners.delete(groupId);
        }
      }
    };
  }

  // イベントを発行するメソッド
  publish(event: ScrollSyncEvent) {
    // 該当グループのリスナーを取得
    const listeners = this.listeners.get(event.syncGroupId);
    if (listeners) {
      // 登録されている全てのリスナーにイベントを通知
      listeners.forEach(callback => callback(event));
    }
  }
}

// メインの同期コントローラーフック
export function useSwiperSyncController(options: SyncControllerOptions) {
  // オプションの分割代入とデフォルト値の設定
  const { syncGroupId, layerId, skipSync = false } = options;
  // EventBusのシングルトンインスタンスをrefで保持
  const eventBus = useRef(SyncEventBus.getInstance());
  // 最後にイベントを発行した時刻を保持
  const lastEmitTime = useRef(0);
  // イベント発行の最小間隔（ミリ秒）- 約60FPSに制限
  const MIN_EMIT_INTERVAL = 16;

  // 同期イベントを発行する関数
  const emitSync = useCallback((delta: number) => {
    // skipSyncが有効な場合は何もしない
    if (skipSync) return;

    const now = Date.now();
    // スロットリング処理：最小間隔未満の場合はスキップ
    if (now - lastEmitTime.current < MIN_EMIT_INTERVAL) return;

    // 同期イベントオブジェクトの作成
    const syncEvent: ScrollSyncEvent = {
      delta,
      sourceId: layerId,
      timestamp: now,
      syncGroupId
    };

    // イベントの発行とタイムスタンプの更新
    eventBus.current.publish(syncEvent);
    lastEmitTime.current = now;
  }, [syncGroupId, layerId, skipSync]);

  // 他のレイヤーからの同期イベントを購読する関数
  const onSync = useCallback((callback: (event: ScrollSyncEvent) => void) => {
    // skipSyncが有効な場合は空の解除関数を返す
    if (skipSync) return () => {};

    // コールバックをラップしてフィルタリング処理を追加
    const wrappedCallback = (event: ScrollSyncEvent) => {
      // 自身が発行したイベントは無視（無限ループ防止）
      if (event.sourceId === layerId) return;

      // 古いイベントは無視（100ms以上前のイベント）
      if (Date.now() - event.timestamp > 100) return;

      // フィルタリングを通過したイベントを実行
      callback(event);
    };

    // イベントの購読を登録し、解除関数を返す
    return eventBus.current.subscribe(syncGroupId, wrappedCallback);
  }, [syncGroupId, layerId, skipSync]);

  // コンポーネントのクリーンアップ処理
  useEffect(() => {
    return () => {
      // 現時点では特別なクリーンアップは不要
      // 将来的にリソース解放が必要になった場合のためのプレースホルダー
    };
  }, []);

  // 公開するAPI
  return {
    emitSync,  // 同期イベントの発行関数
    onSync     // 同期イベントの購読関数
  };
}