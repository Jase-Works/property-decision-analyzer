/**
 * PredictionPanel - 房價/租金走勢預測主面板
 * 包含時間範圍選擇、情境選擇、預測圖表、摘要和警語
 */

import { useState, useEffect } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, RefreshCw, Home, Wallet, User, Database, DollarSign, TrendingDown } from 'lucide-react';
import { PredictionChart } from './PredictionChart';
import { MacroAssumptionsEditor } from './MacroAssumptionsEditor';
import { PredictionDisclaimer } from './PredictionDisclaimer';
import { usePrediction } from '../../hooks/usePrediction';
import type { MarketData, ScenarioData } from '../../types';
import type { PredictionHorizon } from '../../types/prediction';

interface PredictionPanelProps {
  city: string;
  district: string;
  marketData: MarketData | null;
  /** 購入總價（萬元），未來可用於計算報酬率 */
  purchasePrice?: number;
  propertyArea: number;
  /** 使用者輸入的情境假設 */
  scenarioData?: ScenarioData;
  /** 使用者輸入的預期月租金（元） */
  expectedMonthlyRent?: number;
}

export function PredictionPanel({
  city,
  district,
  marketData,
  purchasePrice,
  propertyArea,
  scenarioData,
  expectedMonthlyRent,
}: PredictionPanelProps) {
  // 從市場資料取得房價
  const currentPricePerPing = marketData?.averagePrice || 0;
  // 租金優先使用使用者輸入（若有且 > 0），否則使用市場行情
  const marketAverageRent = marketData?.averageRent || 0;
  const currentMonthlyRent = (expectedMonthlyRent && expectedMonthlyRent > 0) 
    ? expectedMonthlyRent 
    : marketAverageRent;
  // 判斷租金來源
  const isUsingUserRent = expectedMonthlyRent && expectedMonthlyRent > 0 && expectedMonthlyRent !== marketAverageRent;
  
  // 計算購入價格 vs 當前市值比較
  const currentMarketValue = marketData && propertyArea > 0 
    ? marketData.averagePrice * propertyArea 
    : 0;
  const hasValidPurchaseComparison = purchasePrice && purchasePrice > 0 && currentMarketValue > 0;
  const purchaseGainLoss = hasValidPurchaseComparison 
    ? ((currentMarketValue - purchasePrice) / purchasePrice) * 100 
    : 0;

  // 使用預測 Hook（傳入 scenarioData 以同步成長率假設）
  const {
    prediction,
    scenario,
    assumptions,
    horizon,
    isCalculating,
    error,
    latestEconomicData,
    isUsingScenarioOverrides,
    setScenario,
    updateAssumptions,
    resetAssumptions,
    setHorizon,
    recalculate,
  } = usePrediction({
    city,
    district,
    currentPricePerPing,
    currentMonthlyRent,
    propertyArea: propertyArea || 30, // 預設 30 坪
    scenarioData,
  });

  // 展開狀態
  const [isAssumptionsExpanded, setIsAssumptionsExpanded] = useState(false);
  const [activeChart, setActiveChart] = useState<'price' | 'rent'>('price');

  // 時間範圍選項
  const horizonOptions: Array<{ value: PredictionHorizon; label: string }> = [
    { value: 1, label: '1 年' },
    { value: 3, label: '3 年' },
    { value: 5, label: '5 年' },
    { value: 10, label: '10 年' },
  ];

  // 當輸入參數變更時自動重新計算
  useEffect(() => {
    if (city && district && currentPricePerPing > 0 && currentMonthlyRent > 0) {
      recalculate();
    }
  }, [city, district, currentPricePerPing, currentMonthlyRent, propertyArea, horizon, assumptions, recalculate]);

  // 檢查是否有足夠資料
  const hasRequiredData = city && district && currentPricePerPing > 0 && currentMonthlyRent > 0;

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* 標題 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            房價與租金走勢預測
          </h3>
          {prediction && (
            <button
              onClick={recalculate}
              disabled={isCalculating}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
              重新計算
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 無資料提示 */}
        {!hasRequiredData && (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>請先選擇縣市區域並取得市場資料</p>
            <p className="text-sm mt-1">系統將根據市場行情預測未來走勢</p>
          </div>
        )}

        {/* 有資料時顯示預測內容 */}
        {hasRequiredData && (
          <>
            {/* 時間範圍選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                預測時間範圍
              </label>
              <div className="flex gap-2">
                {horizonOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setHorizon(value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      horizon === value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 圖表切換 */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveChart('price')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeChart === 'price'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4" />
                房價走勢
              </button>
              <button
                onClick={() => setActiveChart('rent')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeChart === 'rent'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                租金走勢
              </button>
            </div>

            {/* 資料來源指示器（租金比較 + 情境假設來源） */}
            <div className="flex flex-wrap gap-3 text-xs">
              {/* 租金來源比較 */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isUsingUserRent ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}>
                {isUsingUserRent ? (
                  <>
                    <User className="w-3.5 h-3.5" />
                    <span>租金：使用您輸入的 {expectedMonthlyRent?.toLocaleString()} 元/月</span>
                    {marketAverageRent > 0 && (
                      <span className="text-gray-400">（市場行情 {marketAverageRent.toLocaleString()} 元）</span>
                    )}
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>租金：採用市場行情 {marketAverageRent.toLocaleString()} 元/月</span>
                  </>
                )}
              </div>
              
              {/* 情境假設來源指示器 */}
              {isUsingScenarioOverrides && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  <User className="w-3.5 h-3.5" />
                  <span>
                    成長率：房價 {scenarioData?.priceGrowthRate}%/年、租金 {scenarioData?.rentGrowthRate}%/年（您的假設）
                  </span>
                </div>
              )}
            </div>

            {/* 預測圖表 */}
            {prediction && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {activeChart === 'price' ? '房價預測' : '租金預測'} - {city}{district}
                </h4>
                <PredictionChart
                  historical={prediction.historical}
                  predicted={prediction.predicted}
                  chartType={activeChart}
                  currentYear={currentYear}
                />
              </div>
            )}

            {/* 預測摘要 */}
            {prediction && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 房價變化 */}
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 mb-1">房價累計變化</p>
                  <p className={`text-2xl font-bold ${
                    prediction.summary.cumulativePriceChange >= 0 ? 'text-blue-700' : 'text-red-600'
                  }`}>
                    {prediction.summary.cumulativePriceChange >= 0 ? '+' : ''}
                    {prediction.summary.cumulativePriceChange.toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    {horizon} 年累計
                  </p>
                </div>

                {/* 租金變化 */}
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 mb-1">租金累計變化</p>
                  <p className={`text-2xl font-bold ${
                    prediction.summary.cumulativeRentChange >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {prediction.summary.cumulativeRentChange >= 0 ? '+' : ''}
                    {prediction.summary.cumulativeRentChange.toFixed(1)}%
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    {horizon} 年累計
                  </p>
                </div>

                {/* 毛報酬率變化 */}
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-purple-600 mb-1">期末毛報酬率</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {prediction.summary.endingGrossYield.toFixed(2)}%
                  </p>
                  <p className="text-xs text-purple-500 mt-1">
                    目前 {marketData?.grossYield?.toFixed(2) || '-'}%
                  </p>
                </div>
              </div>
            )}

            {/* 購入價格 vs 當前市值比較 */}
            {hasValidPurchaseComparison && (
              <div className={`rounded-lg p-4 border ${
                purchaseGainLoss >= 0 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className={`w-5 h-5 ${purchaseGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  <h4 className={`font-medium ${purchaseGainLoss >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    購入價格 vs 當前市值
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* 購入價格 */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">您的購入價格</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {purchasePrice?.toLocaleString()} 萬
                    </p>
                  </div>
                  
                  {/* 當前市值 */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">
                      當前市值估算
                      <span className="block text-[10px]">
                        ({marketData?.averagePrice?.toLocaleString()} 萬/坪 × {propertyArea} 坪)
                      </span>
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {currentMarketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} 萬
                    </p>
                  </div>
                  
                  {/* 漲跌幅 */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">漲跌幅</p>
                    <div className={`flex items-center justify-center gap-1 text-lg font-bold ${
                      purchaseGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {purchaseGainLoss >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {purchaseGainLoss >= 0 ? '+' : ''}{purchaseGainLoss.toFixed(1)}%
                      </span>
                    </div>
                    <p className={`text-xs ${purchaseGainLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {purchaseGainLoss >= 0 ? '帳面獲利' : '帳面虧損'} {Math.abs(currentMarketValue - (purchasePrice || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} 萬
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  * 市值估算依區域均價計算，實際價值可能因屋況、樓層等因素有所差異
                </p>
              </div>
            )}

            {/* 總體經濟假設（可展開） */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setIsAssumptionsExpanded(!isAssumptionsExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  總體經濟假設
                </span>
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="hidden sm:inline">
                    {scenario === 'custom' ? '自訂' : 
                      scenario === 'optimistic' ? '樂觀' :
                      scenario === 'baseline' ? '基準' : '悲觀'} 情境
                  </span>
                  {isAssumptionsExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </span>
              </button>
              
              {isAssumptionsExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <MacroAssumptionsEditor
                    assumptions={assumptions}
                    scenario={scenario}
                    latestEconomicData={latestEconomicData}
                    onAssumptionChange={updateAssumptions}
                    onScenarioChange={setScenario}
                    onReset={resetAssumptions}
                  />
                </div>
              )}
            </div>

            {/* 警語 */}
            {prediction && (
              <PredictionDisclaimer
                confidenceRating={prediction.summary.confidenceRating}
                confidenceLabel={prediction.summary.confidenceLabel}
                horizon={horizon}
              />
            )}

            {/* 錯誤訊息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* 資料來源 */}
            {prediction && (
              <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                資料來源：主計總處 CPI ({prediction.dataSourceVersions.cpi})、
                薪資統計 ({prediction.dataSourceVersions.salary})、
                內政部人口統計 ({prediction.dataSourceVersions.fertility})
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
