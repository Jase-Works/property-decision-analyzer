/**
 * 房產持有決策分析器 - 主應用程式
 * 幫助使用者分析「現在出售」vs「持有出租」哪個更划算
 */

import { useState, useCallback } from 'react';
import { Home, Calculator, Settings, Info } from 'lucide-react';
import { PropertyForm } from './components/forms/PropertyForm';
import { FinancialForm } from './components/forms/FinancialForm';
import { ScenarioForm } from './components/forms/ScenarioForm';
import { MarketDataPanel } from './components/results/MarketDataPanel';
import { ResultsPanel } from './components/results/ResultsPanel';
import { ComparisonChart } from './components/charts/ComparisonChart';
import { McpConfigDialog } from './components/McpConfigDialog';
import { useMarketData } from './hooks/useMarketData';
import type {
  PropertyData,
  FinancialData,
  ScenarioData,
  AnalysisResult,
} from './types';
import { calculateAnalysis } from './utils/calculator';

// 預設值
const defaultPropertyData: PropertyData = {
  propertyType: 'presale',
  city: '',
  district: '',
  area: 0,
  purchasePrice: 0,
  purchaseDate: '',
  expectedDeliveryDate: '',
  buildingAge: 0,
};

const defaultFinancialData: FinancialData = {
  loanAmount: 0,
  loanInterestRate: 2.1,
  loanTerm: 30,
  monthlyManagementFee: 0,
  annualPropertyTax: 0,
  annualLandTax: 0,
  annualInsurance: 0,
  expectedMonthlyRent: 0,
  vacancyRate: 5,
};

const defaultScenarioData: ScenarioData = {
  holdingPeriodYears: 5,
  priceGrowthRate: 2,
  rentGrowthRate: 1,
  inflationRate: 2,
  alternativeInvestmentReturn: 5,
};

function App() {
  // 狀態
  const [propertyData, setPropertyData] = useState<PropertyData>(defaultPropertyData);
  const [financialData, setFinancialData] = useState<FinancialData>(defaultFinancialData);
  const [scenarioData, setScenarioData] = useState<ScenarioData>(defaultScenarioData);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showMcpConfig, setShowMcpConfig] = useState(false);
  const [mcpConfigId, setMcpConfigId] = useState(() => 
    localStorage.getItem('funraise_mcp_config_id') || ''
  );

  // 使用市場資料 Hook
  const { 
    marketData, 
    isLoading: marketDataLoading, 
    error: marketDataError, 
    fetchData: fetchMarketData 
  } = useMarketData();

  // 執行分析計算
  const handleCalculate = useCallback(() => {
    // 驗證必填欄位
    if (!propertyData.city || !propertyData.district || !propertyData.area || !propertyData.purchasePrice) {
      alert('請填寫完整的房產資料');
      return;
    }

    const analysisResult = calculateAnalysis(
      propertyData,
      financialData,
      scenarioData,
      marketData
    );
    setResult(analysisResult);
  }, [propertyData, financialData, scenarioData, marketData]);

  // 取得市場資料
  const handleRefreshMarketData = useCallback(async () => {
    await fetchMarketData(propertyData, mcpConfigId);
  }, [fetchMarketData, propertyData, mcpConfigId]);

  // 儲存 MCP Config ID
  const handleSaveMcpConfigId = (configId: string) => {
    setMcpConfigId(configId);
    localStorage.setItem('funraise_mcp_config_id', configId);
  };

  // 檢查是否可以計算
  const canCalculate = 
    propertyData.city && 
    propertyData.district && 
    propertyData.area > 0 && 
    propertyData.purchasePrice > 0 &&
    scenarioData.holdingPeriodYears > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">房產持有決策分析器</h1>
                <p className="text-sm text-gray-500">現在賣 vs 持有出租，哪個更划算？</p>
              </div>
            </div>
            <button
              onClick={() => setShowMcpConfig(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">MCP 設定</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 說明卡片 */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">使用說明</p>
              <p className="text-blue-700">
                輸入您的房產資料、財務資訊和市場假設，系統將計算「現在出售」與「持有 N 年後出售」兩種情境的投資報酬，
                幫助您做出更明智的持有或出售決策。
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：輸入表單（2 columns） */}
          <div className="lg:col-span-2 space-y-6">
            <PropertyForm
              data={propertyData}
              onChange={setPropertyData}
            />

            <FinancialForm
              data={financialData}
              onChange={setFinancialData}
            />

            <ScenarioForm
              data={scenarioData}
              onChange={setScenarioData}
            />

            {/* 計算按鈕 */}
            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                         text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 
                         flex items-center justify-center gap-2 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Calculator className="w-5 h-5" />
              開始分析
            </button>
          </div>

          {/* 右側：市場資料（1 column） */}
          <div className="space-y-6">
            <MarketDataPanel
              data={marketData}
              isLoading={marketDataLoading}
              error={marketDataError}
              onRefresh={handleRefreshMarketData}
            />
          </div>
        </div>

        {/* 分析結果 */}
        {result && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">📊 分析結果</h2>
            
            <ResultsPanel
              result={result}
              holdingYears={scenarioData.holdingPeriodYears}
            />

            <ComparisonChart
              result={result}
              holdingYears={scenarioData.holdingPeriodYears}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">
              資料來源：FUNRAISE MCP（實價登錄、租金行情）
            </p>
            <p>
              ⚠️ 免責聲明：本工具僅供參考，不構成投資建議。實際決策請諮詢專業人士。
            </p>
            <p className="mt-2 text-gray-400">
              v1.0.0 | 開源專案 | MIT License
            </p>
          </div>
        </div>
      </footer>

      {/* MCP 設定對話框 */}
      <McpConfigDialog
        isOpen={showMcpConfig}
        onClose={() => setShowMcpConfig(false)}
        onSave={handleSaveMcpConfigId}
        currentConfigId={mcpConfigId}
      />
    </div>
  );
}

export default App;
