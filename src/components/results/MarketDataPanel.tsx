/**
 * MarketDataPanel - 市場資料面板
 * 顯示從 FUNRAISE MCP 取得的市場行情資料
 */

import type { MarketData } from '../../types';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from 'lucide-react';

interface MarketDataPanelProps {
  data: MarketData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function MarketDataPanel({ data, isLoading, error, onRefresh }: MarketDataPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          📊 市場行情
        </h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? '載入中...' : '更新'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">無法取得市場資料</p>
            <p className="text-yellow-700">{error}</p>
            <p className="mt-1 text-yellow-600">將使用預設估算值進行分析</p>
          </div>
        </div>
      )}

      {!data && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>請先輸入房產地點，再點擊「更新」取得市場資料</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* 路段資料提示 */}
          {data.dataLevel === 'street' && data.streetName && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <span className="text-green-600">📍</span>
                <span>
                  使用 <strong>{data.streetName}</strong> 路段行情
                  {data.priceRange && (
                    <span className="text-green-600 ml-1">
                      （{data.priceRange.min}-{data.priceRange.max} 萬/坪）
                    </span>
                  )}
                </span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 區域/路段均價 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">
                {data.dataLevel === 'street' ? '路段均價' : '區域均價'}
              </p>
              <p className="text-xl font-bold text-gray-900">
                {data.averagePrice.toFixed(1)}
                <span className="text-sm font-normal text-gray-500 ml-1">萬/坪</span>
              </p>
              <div className="flex items-center gap-1 mt-1">
                {renderTrend(data.priceYoYChange)}
                <span className={`text-xs ${getTrendColor(data.priceYoYChange)}`}>
                  {data.priceYoYChange >= 0 ? '+' : ''}{data.priceYoYChange.toFixed(1)}% YoY
                </span>
              </div>
            </div>

            {/* 租金行情 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">租金行情</p>
              <p className="text-xl font-bold text-gray-900">
                {data.averageRent.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">元/月</span>
              </p>
              {data.rentYoYChange !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {renderTrend(data.rentYoYChange)}
                  <span className={`text-xs ${getTrendColor(data.rentYoYChange)}`}>
                    {data.rentYoYChange >= 0 ? '+' : ''}{data.rentYoYChange.toFixed(1)}% YoY
                  </span>
                </div>
              )}
            </div>

            {/* 成交量 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">近期成交量</p>
              <p className="text-xl font-bold text-gray-900">
                {data.transactionVolume}
                <span className="text-sm font-normal text-gray-500 ml-1">筆/月</span>
              </p>
              {data.volumeYoYChange !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {renderTrend(data.volumeYoYChange)}
                  <span className={`text-xs ${getTrendColor(data.volumeYoYChange)}`}>
                    {data.volumeYoYChange >= 0 ? '+' : ''}{data.volumeYoYChange.toFixed(1)}% YoY
                  </span>
                </div>
              )}
            </div>

            {/* 租金報酬率 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">租金報酬率</p>
              <p className="text-xl font-bold text-gray-900">
                {data.grossYield.toFixed(2)}
                <span className="text-sm font-normal text-gray-500 ml-1">%</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                毛報酬率
              </p>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {data.dataSource}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            更新時間：{new Date(data.lastUpdated).toLocaleString('zh-TW')}
          </p>
        </div>
      )}
    </div>
  );
}

function renderTrend(change: number) {
  if (change > 0) {
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  } else if (change < 0) {
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  }
  return <Minus className="w-4 h-4 text-gray-400" />;
}

function getTrendColor(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-500';
}
