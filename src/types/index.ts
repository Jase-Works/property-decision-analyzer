/**
 * 房產持有決策分析器 - TypeScript 類型定義
 */

// ===========================================
// 房產資料
// ===========================================

/** 房產類型 */
export type PropertyType = 'presale' | 'new' | 'existing' | 'old';

/** 房產基本資料 */
export interface PropertyData {
  propertyType: PropertyType;
  city: string;
  district: string;
  area: number;                      // 建坪（坪）
  purchasePrice: number;             // 購入總價（萬元）
  purchaseDate: string;              // 購入日期 (YYYY-MM-DD)
  expectedDeliveryDate?: string;     // 預計交屋日期（預售屋適用）
  buildingAge?: number;              // 屋齡（年）
}

// ===========================================
// 財務資料
// ===========================================

/** 財務資料 */
export interface FinancialData {
  // 貸款資訊
  loanAmount: number;                // 貸款金額（萬元）
  loanInterestRate: number;          // 貸款利率（%，例如 2.1）
  loanTerm: number;                  // 貸款年限（年）
  
  // 持有成本
  monthlyManagementFee: number;      // 每月管理費（元）
  annualPropertyTax: number;         // 年房屋稅（元）
  annualLandTax: number;             // 年地價稅（元）
  annualInsurance: number;           // 年保險費（元）
  
  // 租金收入
  expectedMonthlyRent: number;       // 預期月租金（元）
  vacancyRate: number;               // 預估空置率（%，例如 5）
}

// ===========================================
// 情境假設
// ===========================================

/** 情境假設資料 */
export interface ScenarioData {
  holdingPeriodYears: number;        // 持有年數
  priceGrowthRate: number;           // 房價年增率（%）
  rentGrowthRate: number;            // 租金年增率（%）
  inflationRate: number;             // 通膨率（%）
  alternativeInvestmentReturn: number; // 替代投資報酬率（%）
}

// ===========================================
// 市場資料
// ===========================================

/** 市場資料（來自 FUNRAISE MCP） */
export interface MarketData {
  city: string;
  district: string;
  averagePrice: number;              // 區域均價（萬/坪）
  priceYoYChange: number;            // 房價年增率（%）
  averageRent: number;               // 區域平均月租金（元）
  rentYoYChange?: number;            // 租金年增率（%）
  transactionVolume: number;         // 近期成交量（筆/月）
  volumeYoYChange?: number;          // 成交量年增率（%）
  grossYield: number;                // 毛租金報酬率（%）
  lastUpdated: string;               // 資料更新時間 (ISO string)
  dataSource: string;                // 資料來源
}

// ===========================================
// 分析結果
// ===========================================

/** 現在出售情境結果 */
export interface SellNowResult {
  estimatedSellingPrice: number;     // 預估售價（萬元）
  transactionCosts: number;          // 交易成本（萬元）：仲介費、代書費等
  remainingLoan: number;             // 剩餘貸款（萬元）
  capitalGainsTax: number;           // 房地合一稅（萬元）
  netProceeds: number;               // 淨收入（萬元）
  reinvestmentReturn: number;        // 再投資報酬（萬元）
  totalReturn: number;               // 總報酬（萬元）
  annualizedReturn: number;          // 年化報酬率（%）
}

/** 持有出租情境結果 */
export interface HoldAndRentResult {
  totalRentalIncome: number;         // 累計租金收入（萬元）
  totalHoldingCosts: number;         // 累計持有成本（萬元）
  totalMortgagePayments: number;     // 累計房貸支出（萬元）
  principalRepaid: number;           // 已還本金（萬元）
  futureSellingPrice: number;        // 未來售價（萬元）
  futureTransactionCosts: number;    // 未來交易成本（萬元）
  futureCapitalGainsTax: number;     // 未來房地合一稅（萬元）
  totalReturn: number;               // 總報酬（萬元）
  annualizedReturn: number;          // 年化報酬率（%）
}

/** 年度預測數據（用於圖表） */
export interface YearlyProjection {
  year: number;
  sellNowCumulative: number;         // 現在出售累積報酬
  holdAndRentCumulative: number;     // 持有出租累積報酬
  rentalIncome: number;              // 當年租金收入
  holdingCosts: number;              // 當年持有成本
  propertyValue: number;             // 當年房產價值
}

/** 完整分析結果 */
export interface AnalysisResult {
  sellNow: SellNowResult;
  holdAndRent: HoldAndRentResult;
  recommendation: 'sell' | 'hold' | 'neutral';
  breakEvenYears: number | null;     // 損益兩平年數
  yearlyProjections: YearlyProjection[];
}

// ===========================================
// 應用程式狀態
// ===========================================

/** MCP 設定 */
export interface McpConfig {
  configId: string;
  isConfigured: boolean;
}

/** 縣市行政區資料 */
export interface CityData {
  name: string;
  districts: string[];
}

/** 應用程式完整狀態 */
export interface AppState {
  property: PropertyData;
  financial: FinancialData;
  scenario: ScenarioData;
  market: MarketData | null;
  result: AnalysisResult | null;
  mcpConfig: McpConfig;
  isLoading: boolean;
  error: string | null;
}
