/**
 * ScenarioForm - 情境假設輸入表單
 * 讓使用者設定市場預測參數和分析期間
 */

import type { ScenarioData, MarketData } from '../../types';

interface ScenarioFormProps {
  data: ScenarioData;
  onChange: (data: ScenarioData) => void;
  marketData?: MarketData | null;
}

export function ScenarioForm({ data, onChange, marketData }: ScenarioFormProps) {
  const handleChange = (field: keyof ScenarioData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  // 格式化市場 YoY 顯示
  const formatYoY = (value: number | undefined) => {
    if (value === undefined) return null;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
        情境假設
      </h2>
      
      <div className="space-y-6">
        {/* 分析期間 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3 pb-2 border-b">分析期間</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              持有年數（年）
            </label>
            <input
              type="number"
              value={data.holdingPeriodYears || ''}
              onChange={(e) => handleChange('holdingPeriodYears', parseInt(e.target.value) || 0)}
              placeholder="例如：5"
              min="1"
              max="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              系統將計算持有至第 N 年後出售的投資報酬
            </p>
          </div>
        </div>

        {/* 市場預測 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3 pb-2 border-b">市場預測</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 房價年增率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                房價年增率（%）
                {marketData?.priceYoYChange !== undefined && (
                  <span className="ml-2 text-xs font-normal text-blue-600">
                    市場歷史: {formatYoY(marketData.priceYoYChange)} YoY
                  </span>
                )}
              </label>
              <input
                type="number"
                value={data.priceGrowthRate ?? ''}
                onChange={(e) => handleChange('priceGrowthRate', parseFloat(e.target.value) || 0)}
                placeholder="例如：3"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                近十年平均約 2-5%，可正可負
              </p>
            </div>

            {/* 租金年增率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                租金年增率（%）
                {marketData?.rentYoYChange !== undefined && (
                  <span className="ml-2 text-xs font-normal text-green-600">
                    市場歷史: {formatYoY(marketData.rentYoYChange)} YoY
                  </span>
                )}
              </label>
              <input
                type="number"
                value={data.rentGrowthRate ?? ''}
                onChange={(e) => handleChange('rentGrowthRate', parseFloat(e.target.value) || 0)}
                placeholder="例如：2"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                近十年平均約 1-3%
              </p>
            </div>

            {/* 通膨率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                通膨率（%）
              </label>
              <input
                type="number"
                value={data.inflationRate ?? ''}
                onChange={(e) => handleChange('inflationRate', parseFloat(e.target.value) || 0)}
                placeholder="例如：2"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                台灣長期平均約 1-2%
              </p>
            </div>

            {/* 替代投資報酬率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                替代投資報酬率（%）
              </label>
              <input
                type="number"
                value={data.alternativeInvestmentReturn ?? ''}
                onChange={(e) => handleChange('alternativeInvestmentReturn', parseFloat(e.target.value) || 0)}
                placeholder="例如：5"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                如將資金投入股市/ETF 的預期報酬率
              </p>
            </div>
          </div>
        </div>

        {/* 快速預設 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">快速設定</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({
                ...data,
                priceGrowthRate: 3,
                rentGrowthRate: 2,
                inflationRate: 2,
                alternativeInvestmentReturn: 5,
              })}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              🏠 樂觀情境
            </button>
            <button
              type="button"
              onClick={() => onChange({
                ...data,
                priceGrowthRate: 1,
                rentGrowthRate: 1,
                inflationRate: 2,
                alternativeInvestmentReturn: 5,
              })}
              className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              📊 穩健情境
            </button>
            <button
              type="button"
              onClick={() => onChange({
                ...data,
                priceGrowthRate: -2,
                rentGrowthRate: 0,
                inflationRate: 2,
                alternativeInvestmentReturn: 5,
              })}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              📉 悲觀情境
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
