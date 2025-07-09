// src/lib/logger.ts

interface LoggerOptions {
  flushInterval?: number;
  aggregationLevel?: 'basic' | 'detailed';
  maxEntriesPerGroup?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

interface ActionLogParams {
  [key: string]: string | number | boolean;
}

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  action: string;
  message: string;
  params?: ActionLogParams;
}

// 開発環境かどうかを確認
const isDev = process.env.NODE_ENV === 'development';

// 本番環境でのデバッグログを制御
const isProductionDebugEnabled = !isDev && localStorage?.getItem('enable_production_debug') === 'true';

// デバッグログ対象のモジュール名（本番環境では大幅削減）
const DEBUG_MODULES = isDev ? [
  'HomePage',
  'useInfiniteScroll', 
  'ImageSwiper',
  'BoundaryOptimizer'
] : [
  // 本番環境では重要なもののみ
  'useInfiniteScroll'
];

class Logger {
  private name: string;
  private options: LoggerOptions;
  private aggregatedLogs: Map<string, LogEntry[]>;
  private flushTimer: NodeJS.Timeout | null;

  constructor(name: string, options: LoggerOptions = {}) {
    this.name = name;
    this.options = {
      flushInterval: isDev ? (options.flushInterval || 5000) : 10000, // 本番環境では間隔を長く
      aggregationLevel: options.aggregationLevel || 'basic',
      maxEntriesPerGroup: isDev ? (options.maxEntriesPerGroup || 3) : 1, // 本番環境では最小限
      // ログレベルの最適化
      logLevel: this.getOptimalLogLevel(name, options.logLevel)
    };
    
    this.aggregatedLogs = new Map();
    this.flushTimer = null;

    // 本番環境ではフラッシュ間隔を長くしてパフォーマンス向上
    if (this.options.flushInterval && (isDev || isProductionDebugEnabled)) {
      this.flushTimer = setInterval(() => this.flush(), this.options.flushInterval);
    }
  }

  private getOptimalLogLevel(name: string, requestedLevel?: LoggerOptions['logLevel']): LoggerOptions['logLevel'] {
    if (requestedLevel) return requestedLevel;
    
    if (isDev && DEBUG_MODULES.includes(name)) return 'debug';
    if (isDev) return 'info';
    if (isProductionDebugEnabled) return 'warn';
    return 'error'; // 本番環境ではエラーのみ
  }

  debug(message: string, params?: object) {
    // 本番環境では境界要素の重要な情報のみログ出力
    if (this.shouldLog('debug')) {
      if (isDev || this.isImportantBoundaryEvent(message)) {
        console.log(`[DEBUG][${this.name}] ${message}`, params || '');
      }
    }
  }

  info(message: string, params?: object) {
    if (this.shouldLog('info')) {
      console.log(`[INFO][${this.name}] ${message}`, params || '');
    }
  }

  warn(message: string, params?: object) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN][${this.name}] ${message}`, params || '');
    }
  }

  error(message: string, params?: object) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR][${this.name}] ${message}`, params || '');
    }
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (this.options.logLevel === 'none') return false;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.options.logLevel || 'error');
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex >= currentLevelIndex;
  }

  // 本番環境でも重要な境界要素イベントはログに残す
  private isImportantBoundaryEvent(message: string): boolean {
    if (isDev) return true;
    
    const importantKeywords = [
      'TRIGGERED!', 'loadMoreItems CALLED!', 'repositioned', 'failed', 'error'
    ];
    
    return importantKeywords.some(keyword => 
      message.includes(keyword)
    );
  }

  // 境界要素の状態をログ（本番環境では簡素化）
  logBoundaryState(direction: 'prepend' | 'append', state: {
    isVisible: boolean;
    intersectionRatio: number;
    distanceFromViewport: number;
    needsRepositioning: boolean;
    elementRect?: DOMRect;
    containerRect?: DOMRect;
  }) {
    if (!isDev && !state.needsRepositioning) return; // 本番環境では問題がある場合のみ
    
    this.debug(`🎯 Boundary: ${direction}`, {
      direction,
      isVisible: state.isVisible,
      needsRepositioning: state.needsRepositioning,
      ...(isDev && {
        intersectionRatio: state.intersectionRatio,
        distanceFromViewport: state.distanceFromViewport
      })
    });
  }

  // 境界要素の再配置ログ（本番環境でも重要なので残す）
  logBoundaryReposition(direction: 'prepend' | 'append', action: string, details: {
    fromPosition?: number;
    toPosition?: number;
    reason?: string;
    success?: boolean;
  }) {
    this.info(`🔄 Boundary repositioning: ${direction}`, {
      direction,
      repositionAction: action,
      reason: details.reason,
      success: details.success,
      ...(isDev && {
        fromPosition: details.fromPosition,
        toPosition: details.toPosition
      })
    });
  }

  actionLog(level: 'info' | 'warn' | 'error', action: string, message: string, params?: ActionLogParams) {
    if (!this.shouldLog(level)) return;
    
    const logEntry = {
      timestamp: new Date(),
      level,
      action,
      message,
      params
    };

    const key = `${action}-${level}`;
    if (!this.aggregatedLogs.has(key)) {
      this.aggregatedLogs.set(key, []);
    }
    this.aggregatedLogs.get(key)?.push(logEntry);
  }

  flush() {
    // 本番環境では重要なログのみフラッシュ
    if (!isDev && !isProductionDebugEnabled) {
      // エラーと警告のみ
      this.aggregatedLogs.forEach((logs, key) => {
        if (key.includes('-error') || key.includes('-warn')) {
          const [action, level] = key.split('-');
          console.group(`[${this.name}] ${action} (${level})`);
          logs.slice(-this.options.maxEntriesPerGroup!).forEach(log => console.log(log));
          console.groupEnd();
        }
      });
    } else if (isDev) {
      // 開発環境では全て表示
      this.aggregatedLogs.forEach((logs, key) => {
        const [action, level] = key.split('-');
        console.group(`[${this.name}] Aggregated ${action} logs (${level})`);
        
        if (logs.length > this.options.maxEntriesPerGroup!) {
          console.log(`Showing last ${this.options.maxEntriesPerGroup} of ${logs.length} logs`);
        }
        
        logs.slice(-this.options.maxEntriesPerGroup!).forEach(log => console.log(log));
        console.groupEnd();
      });
    }
    
    this.aggregatedLogs.clear();
  }

  dispose() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  enableLogging(level: LoggerOptions['logLevel'] = 'debug') {
    this.options.logLevel = level;
  }
}

export function getLogger(name: string, options?: LoggerOptions): Logger {
  return new Logger(name, options);
}

export function setProductionLogLevel() {
  // 本番環境でのログレベルを設定
  if (!isDev) {
    console.log('[Logger] Setting production log level');
  }
}

export function enableDebugMode() {
  if (isDev) {
    console.log('[Logger] Debug mode enabled');
  }
}

export function enableProductionDebug() {
  if (localStorage) {
    localStorage.setItem('enable_production_debug', 'true');
    console.log('[Logger] Production debug mode enabled');
  }
} 