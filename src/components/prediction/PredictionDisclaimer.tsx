/**
 * PredictionDisclaimer - 預測警語元件
 * 顯示預測聲明和信心度評級
 */

import { AlertTriangle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PredictionDisclaimerProps {
  confidenceRating: 1 | 2 | 3;
  confidenceLabel: string;
  horizon: number;
}

export function PredictionDisclaimer({
  confidenceRating,
  confidenceLabel,
  horizon,
}: PredictionDisclaimerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 根據信心度決定顏色
  const getConfidenceColor = () => {
    if (confidenceRating === 3) return 'text-green-600';
    if (confidenceRating === 2) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {/* 標題與信心度 */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-medium text-amber-900">預測聲明</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-700">信心度：</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= confidenceRating
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-sm font-medium ${getConfidenceColor()}`}>
                {confidenceLabel}
              </span>
            </div>
          </div>

          {/* 簡短說明 */}
          <p className="text-sm text-amber-800 mt-2">
            本預測僅供參考，基於歷史資料與總體經濟假設推算。
            {horizon >= 5 && (
              <span className="text-amber-900 font-medium">
                {' '}預測時間 {horizon} 年，不確定性較高。
              </span>
            )}
          </p>

          {/* 展開詳細說明 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900 mt-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                收合詳細說明
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                查看詳細說明
              </>
            )}
          </button>

          {/* 詳細說明內容 */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
              <p className="text-sm text-amber-800">
                <strong>模型假設：</strong>
              </p>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-1 ml-2">
                <li>各因子與房價/租金呈線性關係</li>
                <li>基於過去 10-15 年資料，假設未來模式類似</li>
                <li>無法預測重大政策變化、疫情、戰爭等黑天鵝事件</li>
                <li>同一區內不同路段仍有差異</li>
              </ul>
              <p className="text-sm text-amber-800 mt-2">
                <strong>信心區間說明：</strong>
              </p>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-1 ml-2">
                <li>1 年預測：95% 信心區間約 ±4%</li>
                <li>3 年預測：95% 信心區間約 ±7%</li>
                <li>5 年預測：95% 信心區間約 ±9%</li>
                <li>10 年預測：95% 信心區間約 ±13%，僅供參考</li>
              </ul>
              <p className="text-xs text-amber-600 mt-3 italic">
                ⚠️ 實際房價/租金受多種因素影響，可能與預測有顯著差異。
                本工具不構成投資建議。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
